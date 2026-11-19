import { expect, type Page } from "@playwright/test";

export const PASSWORD = "Teste@2026x";

export async function register(page: Page, email: string, name = "Cliente Teste") {
  await page.goto("/cadastro");
  await page.getByLabel("Nome completo").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmar senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/conta$/, { timeout: 30_000 });
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

export const uniqueEmail = (p = "e2e") => `${p}+${Date.now()}${Math.floor(Math.random() * 1000)}@teste.dev`;
