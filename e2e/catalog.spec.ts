import { expect, test } from "@playwright/test";
import { catalogCards, isDesktop } from "./helpers";

test.describe("Поиск", () => {
  test("ищет по названию с задержкой и пишет запрос в URL", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("searchbox", { name: "Поиск фильмов" }).locator("visible=true").fill("орбита");
    await expect(page).toHaveURL(/[?&]q=%D0%BE%D1%80%D0%B1%D0%B8%D1%82%D0%B0/);
    await expect(catalogCards(page)).toHaveCount(1);
    await expect(catalogCards(page).first()).toContainText("Орбита 9");
  });

  test("быстрый набор: буквы не пропадают и не переставляются", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("searchbox", { name: "Поиск фильмов" }).locator("visible=true");
    await box.click();
    // Паузы ~ задержке поиска: адрес обновляется, пока пользователь продолжает печатать
    for (const ch of "тихий берег") {
      await page.keyboard.type(ch);
      await page.waitForTimeout(ch === " " ? 450 : 120);
    }
    await page.waitForTimeout(1200);
    await expect(box).toHaveValue("тихий берег");
    await expect(page).toHaveURL(/q=%D1%82%D0%B8%D1%85%D0%B8%D0%B9(\+|%20)%D0%B1%D0%B5%D1%80%D0%B5%D0%B3/);
    await expect(catalogCards(page)).toHaveCount(1);
  });

  test("рубрика сбрасывает поиск и очищает поле", async ({ page }, testInfo) => {
    await page.goto("/?q=" + encodeURIComponent("орбита"));
    const box = page.getByRole("searchbox", { name: "Поиск фильмов" }).locator("visible=true");
    await expect(box).toHaveValue("орбита");
    if (isDesktop(testInfo)) {
      await page.getByRole("navigation", { name: "Разделы" }).getByRole("link", { name: /Избранное/ }).click();
      await expect(page).toHaveURL(/fav=1/);
      await expect(page).not.toHaveURL(/q=/);
      await expect(box).toHaveValue("");
      await page.goto("/?q=" + encodeURIComponent("орбита"));
      await page.getByRole("group", { name: "Быстрый выбор жанра" }).getByRole("button", { name: "Драма" }).click();
    } else {
      await page.getByRole("group", { name: "Жанры" }).getByRole("button", { name: "Драма" }).click();
    }
    await expect(page).toHaveURL(/genre=/);
    await expect(page).not.toHaveURL(/q=/);
    await expect(box).toHaveValue("");
  });

  test("ищет по режиссёру и актёрам", async ({ page }) => {
    await page.goto("/?q=" + encodeURIComponent("режиссёр"));
    await expect(catalogCards(page).first()).toBeVisible();
  });

  test("пустой результат и сброс", async ({ page }, testInfo) => {
    await page.goto("/?q=zzzz");
    await expect(page.getByText("Ничего не нашлось").locator("visible=true")).toBeVisible();
    const reset = isDesktop(testInfo) ? "Показать все фильмы" : "Сбросить поиск";
    await page.getByRole("button", { name: reset }).click();
    await expect(page).not.toHaveURL(/q=/);
    await expect(catalogCards(page).first()).toBeVisible();
  });
});

test.describe("Фильтры", () => {
  test("мобила: экран фильтров → каталог с параметрами в URL", async ({ page }, testInfo) => {
    test.skip(isDesktop(testInfo), "на ПК фильтры в панели слева");
    await page.goto("/");
    await page.getByRole("link", { name: "Фильтры" }).click();
    await expect(page).toHaveURL(/\/filters/);
    await page.getByRole("button", { name: "Комедия" }).click();
    await page.getByRole("link", { name: "Показать фильмы" }).click();
    await expect(page).toHaveURL(/\/\?.*genre=%D0%9A%D0%BE%D0%BC%D0%B5%D0%B4%D0%B8%D1%8F/);
    const cards = catalogCards(page);
    await expect(cards.first()).toBeVisible();
    for (const text of await cards.allInnerTexts()) expect(text).toContain("Комедия");
  });

  test("ПК: панель фильтров — десятилетие и жанр", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo), "панель есть только на ПК");
    await page.goto("/");
    const panel = page.locator('[class*="FilterPanel_"]').first();
    // Флажки управляются адресом: состояние меняется после перехода
    await panel.getByLabel("2020-е").click();
    await expect(page).toHaveURL(/decade=2020s/);
    await expect(panel.getByLabel("2020-е")).toBeChecked();
    await panel.getByLabel("Драма").click();
    await expect(page).toHaveURL(/genre=/);
    const cards = catalogCards(page);
    await expect(cards.first()).toBeVisible();
    for (const text of await cards.allInnerTexts()) {
      expect(text).toMatch(/202\d/);
    }
  });

  test("ПК: /filters перенаправляет на каталог и сохраняет параметры", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo), "редирект только с 1024px");
    await page.goto("/filters?genre=" + encodeURIComponent("Драма") + "&decade=2010s");
    await expect(page).toHaveURL(/\/\?(?=.*genre=%D0%94%D1%80%D0%B0%D0%BC%D0%B0)(?=.*decade=2010s)/);
    await expect(page.locator('[class*="FilterPanel_"]').first().getByLabel("2010-е")).toBeChecked();
  });

  test("мобила: /filters открывается как отдельный экран", async ({ page }, testInfo) => {
    test.skip(isDesktop(testInfo));
    await page.goto("/filters?decade=2010s");
    await expect(page).toHaveURL(/\/filters/);
    await expect(page.getByRole("button", { name: "2010-е" })).toHaveAttribute("aria-pressed", "true");
  });
});
