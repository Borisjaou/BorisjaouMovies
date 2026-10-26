import { defineConfig, devices } from "@playwright/test";
import { E2E_ADMIN_EMAIL } from "./e2e/helpers";

/**
 * E2E: отдельная SQLite-база data/e2e.db (пересоздаётся при запуске сервера),
 * production-сборка на порту 3210, администратор — admin@e2e.test.
 *
 *   npx playwright install chromium   # один раз
 *   npm run test:e2e
 */
const PORT = Number(process.env.E2E_PORT ?? 3210);
const BASE_URL = `http://localhost:${PORT}`;

const env = {
  DATABASE_URL: "file:./data/e2e.db",
  AUTH_SECRET: "e2e-secret-not-for-production-0123456789",
  ADMIN_EMAILS: E2E_ADMIN_EMAIL,
  STORAGE_DRIVER: "local",
  NEXT_PUBLIC_SITE_URL: BASE_URL,
  // Google в тестах не нужен
  AUTH_GOOGLE_ID: "",
  AUTH_GOOGLE_SECRET: "",
};

// Команда сборки (можно переопределить, например "npx next build --webpack")
const BUILD = process.env.E2E_BUILD_COMMAND || "npm run build";

// В песочнице без скачанных браузеров можно указать свой Chromium
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e",
  // Тесты меняют общую базу (избранное пользователей, новые фильмы) — по очереди
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    locale: "ru-RU",
    trace: "retain-on-failure",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, launchOptions: { executablePath } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, launchOptions: { executablePath } } },
  ],
  webServer: {
    command: `npx tsx e2e/setup-db.ts data/e2e.db && ${BUILD} && npx next start -p ${PORT}`,
    url: BASE_URL,
    env,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
