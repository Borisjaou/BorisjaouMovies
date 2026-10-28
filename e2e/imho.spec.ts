import { expect, test } from "@playwright/test";
import { catalogCards, createFilm, createUser, deleteFilm, isDesktop, login, uniqueEmail } from "./helpers";

test.describe("ИМХО и «Яма»", () => {
  let slug = "";
  let title = "";

  test.beforeEach(() => {
    title = `Фильм для ИМХО ${Date.now()}`;
    slug = createFilm(title);
  });
  test.afterEach(() => deleteFilm(slug));

  test("админ пишет ИМХО «не понравился»: фильм уходит из каталога в «Яму», посетители видят ИМХО", async ({
    page,
    browser,
  }, testInfo) => {
    const email = uniqueEmail("imho-admin");
    createUser(email, "password123", "Админ", "admin");
    await login(page, email, "password123", `/film/${slug}`);
    await expect(page).toHaveURL(new RegExp(`/film/${slug}$`));

    // Пустое ИМХО у админа — сразу форма
    const block = page.locator("section").filter({ has: page.getByRole("heading", { name: "ИМХО", exact: true }) }).locator("visible=true");
    await block.getByRole("button", { name: "Не понравился" }).click();
    await block.getByLabel("Комментарий — видят все").fill("Скучно и затянуто");
    await block.getByRole("button", { name: "Сохранить" }).click();
    await expect(block.getByText("Скучно и затянуто")).toBeVisible();
    await expect(block.getByText("Не понравился")).toBeVisible();

    // В каталоге фильма нет
    await page.goto(`/?q=${encodeURIComponent(title)}`);
    await expect(page.getByText("Ничего не нашлось").locator("visible=true")).toBeVisible();

    // «Яма» — через меню «Ещё»
    await page.goto("/");
    if (isDesktop(testInfo)) {
      const nav = page.getByRole("navigation", { name: "Разделы" });
      await nav.getByRole("button", { name: "Ещё" }).click();
      await nav.getByRole("link", { name: "Яма" }).click();
      await expect(page).toHaveURL(/yama=1/);
      await expect(catalogCards(page).filter({ hasText: title })).toHaveCount(1);
    } else {
      await page.getByRole("button", { name: "Ещё" }).click();
      await page.getByRole("link", { name: "Яма" }).click();
      await expect(page).toHaveURL(/\/yama$/);
      await expect(page.getByText(title)).toBeVisible();
      await expect(page.getByText("Скучно и затянуто")).toBeVisible();
    }

    // Посетитель видит ИМХО, но без формы
    const guest = await browser.newPage({ viewport: page.viewportSize() ?? undefined });
    await guest.goto(`/film/${slug}`);
    const guestBlock = guest.locator("section").filter({ has: guest.getByRole("heading", { name: "ИМХО", exact: true }) }).locator("visible=true");
    await expect(guestBlock.getByText("Скучно и затянуто")).toBeVisible();
    await expect(guestBlock.getByRole("button", { name: "Сохранить" })).toHaveCount(0);
    await expect(guest.getByRole("button", { name: "Изменить ИМХО" })).toHaveCount(0);
    await guest.close();
  });

  test("админ отмечает «Просмотрено» — окно «Как вам фильм?»; посетителю ИМХО без оценки не показывается", async ({
    page,
    browser,
  }) => {
    const guest = await browser.newPage();
    await guest.goto(`/film/${slug}`);
    await expect(guest.getByRole("heading", { name: "ИМХО", exact: true })).toHaveCount(0);
    await guest.close();

    const email = uniqueEmail("imho-sheet");
    createUser(email, "password123", "Админ", "admin");
    await login(page, email, "password123", `/film/${slug}`);
    await expect(page).toHaveURL(new RegExp(`/film/${slug}$`));

    await page.getByRole("button", { name: "Отметить как просмотренный" }).locator("visible=true").first().click();
    const dialog = page.getByRole("dialog", { name: `Как вам «${title}»?` });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Понравился", exact: true }).click();
    await dialog.getByLabel("Комментарий — видят все").fill("Пересмотрю");
    await dialog.getByRole("button", { name: "Сохранить" }).click();
    await expect(dialog).toHaveCount(0);

    const block = page.locator("section").filter({ has: page.getByRole("heading", { name: "ИМХО", exact: true }) }).locator("visible=true");
    await expect(block.getByText("Пересмотрю")).toBeVisible();
    await expect(block.getByText("Понравился", { exact: true })).toBeVisible();
  });
});
