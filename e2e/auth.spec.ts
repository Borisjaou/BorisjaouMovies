import { expect, test } from "@playwright/test";
import { login, register, uniqueEmail } from "./helpers";

test.describe("Вход и регистрация", () => {
  test("ошибки формы на русском", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByText("Введите эл. почту")).toBeVisible();
    await expect(page.getByText("Введите пароль")).toBeVisible();

    await page.getByRole("tab", { name: "Регистрация" }).click();
    await page.getByLabel("Эл. почта").fill("не-почта");
    await page.getByLabel("Пароль", { exact: true }).fill("123");
    await page.getByRole("button", { name: "Создать аккаунт" }).click();
    await expect(page.getByText("Введите имя")).toBeVisible();
    await expect(page.getByText("Проверьте адрес эл. почты")).toBeVisible();
    await expect(page.getByText("Минимум 8 символов").locator("visible=true").last()).toBeVisible();
  });

  test("вкладки переключаются стрелками", async ({ page }) => {
    await page.goto("/login");
    const loginTab = page.getByRole("tab", { name: "Вход" });
    await loginTab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Регистрация" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: "Регистрация" })).toBeFocused();
  });

  test("регистрация, повторная почта, вход с неверным и верным паролем", async ({ page, context }) => {
    const email = uniqueEmail("user");
    await register(page, email, "password123", "/genres");
    await expect(page).toHaveURL(/\/genres$/);

    await context.clearCookies();
    await page.goto("/login");
    await page.getByRole("tab", { name: "Регистрация" }).click();
    await page.getByLabel("Имя").fill("Второй");
    await page.getByLabel("Эл. почта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill("password123");
    await page.getByRole("button", { name: "Создать аккаунт" }).click();
    await expect(page.getByText("Этот адрес уже зарегистрирован")).toBeVisible();

    await login(page, email, "wrong-password");
    await expect(page.getByRole("alert").filter({ hasText: "Неверная эл. почта или пароль" })).toBeVisible();

    await login(page, email, "password123", "/genres");
    await expect(page).toHaveURL(/\/genres$/);
  });

  test("callbackUrl только внутри сайта", async ({ page }) => {
    const email = uniqueEmail("redirect");
    await register(page, email, "password123", "https://evil.example.com/");
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\//);
  });
});
