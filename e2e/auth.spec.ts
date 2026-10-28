import { expect, test } from "@playwright/test";
import { createUser, E2E_ADMIN_EMAIL, login, uniqueEmail } from "./helpers";

test.describe("Вход; регистрация закрыта", () => {
  test("на /login только вход: вкладки «Регистрация» нет", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(page.getByText("Регистрация")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Создать аккаунт" })).toHaveCount(0);
    await expect(page.getByLabel("Имя")).toHaveCount(0);
  });

  test("ошибки формы на русском", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByText("Введите эл. почту")).toBeVisible();
    await expect(page.getByText("Введите пароль")).toBeVisible();

    await page.goto("/login?mode=register");
    await page.getByLabel("Эл. почта").fill("не-почта");
    await page.getByLabel("Пароль", { exact: true }).fill("123");
    await page.getByRole("button", { name: "Создать аккаунт" }).click();
    await expect(page.getByText("Введите имя")).toBeVisible();
    await expect(page.getByText("Проверьте адрес эл. почты")).toBeVisible();
    await expect(page.getByText("Минимум 8 символов").locator("visible=true").last()).toBeVisible();
  });

  test("прямая ссылка на регистрацию не пускает почту не из ADMIN_EMAILS", async ({ page }) => {
    const email = uniqueEmail("closed");
    await page.goto("/login?mode=register");
    await page.getByLabel("Имя").fill("Чужой");
    await page.getByLabel("Эл. почта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill("password123");
    await page.getByRole("button", { name: "Создать аккаунт" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Регистрация закрыта" })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    // Аккаунт не создан: войти нельзя
    await login(page, email, "password123");
    await expect(page.getByRole("alert").filter({ hasText: "Неверная эл. почта или пароль" })).toBeVisible();
    expect(E2E_ADMIN_EMAIL).not.toBe(email);
  });

  test("вход с неверным и верным паролем", async ({ page }) => {
    const email = uniqueEmail("user");
    createUser(email);

    await login(page, email, "wrong-password");
    await expect(page.getByRole("alert").filter({ hasText: "Неверная эл. почта или пароль" })).toBeVisible();

    await login(page, email, "password123", "/genres");
    await expect(page).toHaveURL(/\/genres$/);
  });

  test("callbackUrl только внутри сайта", async ({ page }) => {
    const email = uniqueEmail("redirect");
    createUser(email);
    await login(page, email, "password123", "https://evil.example.com/");
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\//);
  });
});
