import { expect, test } from "@playwright/test";
import { catalogCards, isDesktop, register, uniqueEmail } from "./helpers";

test.describe("«Надо посмотреть» и «Просмотрено»", () => {
  test("гость: добавить, перенести в «Просмотрено», убрать", async ({ page }, testInfo) => {
    await page.goto("/");
    const card = catalogCards(page).filter({ hasText: "Орбита 9" });
    await card.getByRole("button", { name: "Добавить в «Надо посмотреть»" }).click();
    await expect(card.getByRole("button", { name: "Убрать из «Надо посмотреть»" })).toBeVisible();

    // Фильм не может быть в обоих списках: отметка «Просмотрено» убирает его из «Надо посмотреть»
    await card.getByRole("button", { name: "Отметить как просмотренный" }).click();
    await expect(card.getByRole("button", { name: "Убрать из «Просмотрено»" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Добавить в «Надо посмотреть»" })).toBeVisible();

    if (isDesktop(testInfo)) {
      const nav = page.getByRole("navigation", { name: "Разделы" });
      await expect(nav.getByRole("link", { name: /Надо посмотреть/ })).toContainText("0");
      await nav.getByRole("link", { name: /Надо посмотреть/ }).click();
      await expect(page).toHaveURL(/list=watchlist/);
      await expect(page.getByText("В «Надо посмотреть» пока пусто")).toBeVisible();
      // «Просмотрено» — в меню «Ещё»
      await nav.getByRole("button", { name: "Ещё" }).click();
      await expect(nav.getByRole("link", { name: /Просмотрено/ })).toContainText("1");
      await nav.getByRole("link", { name: /Просмотрено/ }).click();
      await expect(page).toHaveURL(/list=watched/);
      await expect(catalogCards(page)).toHaveCount(1);
      await catalogCards(page).first().getByRole("button", { name: "Убрать из «Просмотрено»" }).click();
      await expect(page.getByText("В «Просмотрено» пока пусто")).toBeVisible();
    } else {
      const nav = page.getByRole("navigation", { name: "Основная навигация" });
      // «Просмотрено» — в меню «Ещё»
      await nav.getByRole("button", { name: "Ещё" }).click();
      await expect(page.getByRole("link", { name: /Просмотрено/ })).toContainText("1");
      await page.getByRole("link", { name: /Просмотрено/ }).click();
      await expect(page).toHaveURL(/\/watched$/);
      await expect(page.getByRole("heading", { name: "Просмотрено" })).toBeVisible();
      await expect(page.getByText("Орбита 9")).toBeVisible();
      await page.getByRole("button", { name: /Убрать из «Просмотрено»/ }).first().click();
      await expect(page.getByText("Отметьте фильм галочкой, когда посмотрите его")).toBeVisible();

      await nav.getByRole("link", { name: /Посмотреть/ }).click();
      await expect(page).toHaveURL(/\/watchlist$/);
      await expect(page.getByRole("heading", { name: "Надо посмотреть" })).toBeVisible();
    }
  });

  test("страница фильма: кнопки списков; после входа списки в аккаунте", async ({ page }) => {
    await page.goto("/film/tihiy-bereg");
    await page.getByRole("button", { name: "Добавить в «Надо посмотреть»" }).locator("visible=true").first().click();
    await expect(page.getByRole("button", { name: "Убрать из «Надо посмотреть»" }).locator("visible=true").first()).toBeVisible();

    await register(page, uniqueEmail("watch"));
    await page.evaluate(() => localStorage.removeItem("borisjaou:watchlists"));
    await page.goto("/film/tihiy-bereg");
    const inList = page.getByRole("button", { name: "Убрать из «Надо посмотреть»" }).locator("visible=true").first();
    await expect(inList).toBeVisible();

    await page.getByRole("button", { name: "Отметить как просмотренный" }).locator("visible=true").first().click();
    await expect(page.getByRole("button", { name: "Убрать из «Просмотрено»" }).locator("visible=true").first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Убрать из «Просмотрено»" }).locator("visible=true").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Добавить в «Надо посмотреть»" }).locator("visible=true").first()).toBeVisible();
  });
});
