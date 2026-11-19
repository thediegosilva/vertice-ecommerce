import { expect, test } from "@playwright/test";
import { register, uniqueEmail } from "./helpers";

test("fluxo completo: cadastro → carrinho → VERTICE10 → pagamento → meus pedidos", async ({ page }) => {
  test.setTimeout(120_000);
  await register(page, uniqueEmail("compra"));

  // Produto com tamanho obrigatório
  await page.goto("/produto/tenis-fluxo-runner");
  await page.getByTestId("add-to-cart").click();
  await expect(page.getByText("Selecione um tamanho")).toBeVisible();
  await page.getByRole("radio", { name: "42" }).click();
  await page.getByTestId("add-to-cart").click();
  const drawer = page.getByTestId("cart-drawer");
  await expect(drawer.getByTestId("cart-item")).toHaveCount(1);
  await expect(drawer).toContainText("Você ganhou frete grátis");
  await drawer.getByRole("link", { name: "Finalizar compra" }).click();

  // Passo 1 — Dados
  await expect(page).toHaveURL(/\/checkout/);
  await page.getByLabel("Destinatário", { exact: true }).fill("Cliente Teste");
  await page.getByLabel("Telefone", { exact: true }).fill("(11) 91234-5678");
  await page.getByLabel("CEP", { exact: true }).fill("01310-100");
  await page.getByLabel("Rua", { exact: true }).fill("Avenida Paulista");
  await page.getByLabel("Número", { exact: true }).fill("1000");
  await page.getByLabel("Bairro", { exact: true }).fill("Bela Vista");
  await page.getByLabel("Cidade", { exact: true }).fill("São Paulo");
  await page.getByTestId("step1-next").click();

  // Passo 2 — Pagamento + cupom (validado no backend)
  await page.getByTestId("coupon-input").fill("INVALIDO1");
  await page.getByTestId("coupon-apply").click();
  await expect(page.getByText("Cupom inválido.")).toBeVisible();
  await page.getByTestId("coupon-input").fill("VERTICE10");
  await page.getByTestId("coupon-apply").click();
  await expect(page.getByTestId("discount")).toHaveText(/R\$\s?64,99/);
  await expect(page.getByTestId("total")).toHaveText(/R\$\s?584,91/);
  await page.getByTestId("step2-next").click();

  // Passo 3 — Revisão → pagamento
  await page.getByTestId("place-order").click();
  await page.waitForURL(/checkout\/(simulado|sucesso)|checkout\.stripe\.com/, { timeout: 30_000 });
  test.skip(page.url().includes("stripe.com"), "Stripe real configurado — pagar manualmente com 4242 4242 4242 4242");
  await page.getByTestId("mock-pay").click();
  await expect(page.getByRole("heading", { name: "Pedido confirmado!" })).toBeVisible({ timeout: 30_000 });
  const number = (await page.getByTestId("order-number").textContent())!.trim();
  await expect(page.getByTestId("cart-count")).toHaveCount(0); // carrinho limpo

  // Meus pedidos + rastreio
  await page.goto("/conta/pedidos");
  await expect(page.getByText(number)).toBeVisible();
  await page.getByText(number).click();
  await expect(page.getByText("Pagamento aprovado")).toBeVisible();
  await expect(page.getByText("Rastreamento")).toBeVisible();
});
