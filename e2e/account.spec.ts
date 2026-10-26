import { expect, test } from "@playwright/test";
import { isDesktop, register, uniqueEmail } from "./helpers";

test.describe("Шапка вошедшего и выход", () => {
  test("ПК: имя и «Выйти» вместо «Войти», выход возвращает гостя", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo), "на мобиле выход в профиле");
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Войти" })).toBeVisible();

    const email = uniqueEmail("header");
    await register(page, email);
    await page.goto("/genres");
    const header = page.locator("header:visible").first();
    await expect(header.getByText("Тестовый зритель")).toBeVisible();
    await expect(header.getByRole("link", { name: "Войти" })).toHaveCount(0);

    // Страница фильма — та же шапка
    await page.goto("/film/orbita-9");
    await header.getByRole("button", { name: "Выйти" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Войти" })).toBeVisible();
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fprofile/);
  });

  test("мобила: «Профиль» → экран профиля → «Выйти»", async ({ page }, testInfo) => {
    test.skip(isDesktop(testInfo), "экран профиля только на мобиле");
    const nav = page.getByRole("navigation", { name: "Основная навигация" });

    await page.goto("/");
    await nav.getByRole("link", { name: "Профиль" }).click();
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fprofile/);

    const email = uniqueEmail("profile");
    await page.getByRole("tab", { name: "Регистрация" }).click();
    await page.getByLabel("Имя").fill("Тестовый зритель");
    await page.getByLabel("Эл. почта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill("password123");
    await page.getByRole("button", { name: "Создать аккаунт" }).click();
    await expect(page).toHaveURL(/\/profile$/);

    await expect(page.getByRole("heading", { name: "Профиль" })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole("link", { name: "Админка" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Профиль" })).toHaveAttribute("aria-current", "page");

    await page.getByRole("button", { name: "Выйти" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(nav.getByRole("link", { name: "Профиль" })).toHaveAttribute("href", /\/login/);
  });
});
