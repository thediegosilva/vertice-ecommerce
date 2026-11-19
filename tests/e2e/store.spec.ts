import { expect, test } from "@playwright/test";

test("home exibe hero, CTAs e produtos", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Vista a cidade.");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Viva o movimento.");
  await expect(page.getByRole("link", { name: /Ver Coleção/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver Lookbook" }).first()).toBeVisible();
  await expect(page.getByTestId("product-card").first()).toBeVisible();
  await expect(page.getByText("ou 10x de").first()).toBeVisible();
});

test("catálogo: busca ao vivo e ordenação", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.getByTestId("product-card")).toHaveCount(8);
  await page.getByTestId("shop-search").fill("fone");
  await expect(page).toHaveURL(/q=fone/);
  await expect(page.getByTestId("product-card")).toHaveCount(1);
  await expect(page.getByTestId("product-card").first()).toContainText("Fone Pulse One");

  await page.getByTestId("shop-search").fill("");
  await expect(page.getByTestId("product-card")).toHaveCount(8);
  await page.getByTestId("shop-sort").selectOption("price-asc");
  await expect(page).toHaveURL(/sort=price-asc/);
  await expect(page.getByTestId("product-card").first()).toContainText("Camiseta Essential Oversized");
});

test("quick view adiciona ao carrinho e mostra barra de frete grátis", async ({ page }) => {
  await page.goto("/shop?category=beleza");
  const card = page.getByTestId("product-card").first();
  await card.hover();
  await card.getByRole("button", { name: "Compra rápida" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: "50ml" }).click();
  await dialog.getByTestId("add-to-cart").click();
  const drawer = page.getByTestId("cart-drawer");
  await expect(drawer).toBeVisible();
  await expect(drawer.getByTestId("cart-item")).toHaveCount(1);
  await expect(drawer).toContainText("Falta R$");
  await expect(drawer).toContainText("frete grátis");
});

test("produto inexistente retorna 404", async ({ page }) => {
  const res = await page.goto("/produto/nao-existe");
  expect(res?.status()).toBe(404);
});

test("modo escuro: alterna, aplica e persiste após recarregar", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/\bdark\b/);
  await page.getByTestId("theme-toggle").click(); // sistema → claro
  await page.getByTestId("theme-toggle").click(); // claro → escuro
  await expect(html).toHaveClass(/\bdark\b/);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe("rgb(13, 13, 12)");
  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
});
