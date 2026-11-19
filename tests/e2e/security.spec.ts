import { expect, test } from "@playwright/test";
import { login, register, uniqueEmail, PASSWORD } from "./helpers";

test("rotas privadas exigem login", async ({ page }) => {
  await page.goto("/conta/pedidos");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fconta%2Fpedidos/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("usuário comum não acessa /admin (404)", async ({ page }) => {
  await register(page, uniqueEmail("comum"));
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);
});

test("IDOR: usuário não vê pedido de outro usuário", async ({ browser }) => {
  test.setTimeout(120_000);
  // Usuário A cria pedido (via checkout rápido simulado)
  const a = await browser.newPage();
  await register(a, uniqueEmail("dono"));
  await a.goto("/produto/oculos-noir-classic");
  await a.getByTestId("add-to-cart").click();
  await expect(a.getByTestId("cart-drawer").getByTestId("cart-item")).toHaveCount(1);
  await a.goto("/checkout");
  for (const [l, v] of [["Destinatário", "Dono"], ["CEP", "01310100"], ["Rua", "Rua A"], ["Número", "1"], ["Bairro", "Centro"], ["Cidade", "São Paulo"]]) await a.getByLabel(l, { exact: true }).fill(v);
  await a.getByTestId("step1-next").click();
  await a.getByTestId("step2-next").click();
  await a.getByTestId("place-order").click();
  await a.waitForURL(/checkout\/simulado/);
  const number = new URL(a.url()).searchParams.get("pedido")!;

  // Usuário B tenta acessar
  const b = await browser.newPage();
  await register(b, uniqueEmail("intruso"));
  const res = await b.goto(`/conta/pedidos/${number}`);
  expect(res?.status()).toBe(404);
  const res2 = await b.goto(`/checkout/sucesso?pedido=${number}`);
  expect(res2?.status()).toBe(404);
});

test("bloqueio após 5 tentativas de login falhas", async ({ page }) => {
  const email = uniqueEmail("lock");
  await register(page, email);
  await page.context().clearCookies();
  for (let i = 0; i < 5; i++) {
    await login(page, email, "SenhaErrada1");
    await expect(page.locator("form p[role=alert]")).toContainText("Email ou senha incorretos");
  }
  // Mesmo com a senha CORRETA, a conta fica bloqueada por 15 min
  await login(page, email, PASSWORD);
  await expect(page.locator("form p[role=alert]")).toContainText("bloqueada");
});

test("admin acessa o painel", async ({ page }) => {
  await login(page, "admin@vertice.dev", "Admin@Vertice2026");
  await page.waitForURL(/\/conta/);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.goto("/admin/produtos");
  await expect(page.getByText("Tênis Fluxo Runner")).toBeVisible();
});
