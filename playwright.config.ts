import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3000);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: `http://localhost:${PORT}`, trace: "on-first-retry", locale: "pt-BR" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : { command: `npx next dev -p ${PORT}`, port: PORT, reuseExistingServer: true, timeout: 120_000, env: { DISABLE_RATE_LIMIT: "true" } },
});
