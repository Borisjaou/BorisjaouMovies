import { expect, test } from "@playwright/test";
import { catalogCards, isDesktop, register, uniqueEmail } from "./helpers";

test.describe("Избранное", () => {
  test("гость: сердце, тост, счётчик, список и удаление", async ({ page }, testInfo) => {
    await page.goto("/");
    const card = catalogCards(page).filter({ hasText: "Орбита 9" });
    await card.getByRole("button", { name: "Добавить в избранное" }).click();
    await expect(card.getByRole("button", { name: "Убрать из избранного" })).toBeVisible();

    if (isDesktop(testInfo)) {
      await expect(page.getByRole("status")).toContainText("«Орбита 9» добавлен в избранное");
      await page.getByRole("link", { name: /Избранное/ }).click();
      await expect(page).toHaveURL(/fav=1/);
      await expect(catalogCards(page)).toHaveCount(1);
      await catalogCards(page).first().getByRole("button", { name: "Убрать из избранного" }).click();
      await expect(page.getByText("В избранном пока пусто")).toBeVisible();
    } else {
      const nav = page.getByRole("navigation", { name: "Основная навигация" });
      await expect(nav.getByRole("link", { name: /Избранное/ })).toContainText("1");
      await nav.getByRole("link", { name: /Избранное/ }).click();
      await expect(page).toHaveURL(/\/favorites/);
      await expect(page.getByText("Орбита 9")).toBeVisible();
      await page.getByRole("button", { name: /Убрать из избранного/ }).first().click();
      await expect(page.getByText("Орбита 9")).toHaveCount(0);
    }
  });

  test("гостевое избранное переносится в аккаунт после входа", async ({ page }) => {
    await page.goto("/film/tihiy-bereg");
    await page.getByRole("button", { name: /В избранное|Добавить в избранное/ }).locator("visible=true").first().click();
    await register(page, uniqueEmail("fav"));
    // Локальный список очищен, фильм в базе аккаунта
    await page.evaluate(() => localStorage.removeItem("borisjaou:favorites"));
    await page.goto("/film/tihiy-bereg");
    await expect(page.getByRole("button", { name: /В избранном|Убрать из избранного/ }).locator("visible=true").first()).toBeVisible();
  });
});
