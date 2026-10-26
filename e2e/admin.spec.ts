import { expect, test, type Page } from "@playwright/test";
import { catalogCards, E2E_ADMIN_EMAIL, isDesktop, login, pngBuffer, register, uniqueEmail } from "./helpers";

const ADMIN_PASSWORD = "admin-password-123";

/** Администратор: при первом запуске на чистой базе регистрируется (почта из ADMIN_EMAILS), дальше входит */
async function signInAsAdmin(page: Page) {
  await login(page, E2E_ADMIN_EMAIL, ADMIN_PASSWORD, "/admin/films");
  const wrong = page.getByRole("alert").filter({ hasText: "Неверная эл. почта или пароль" });
  const outcome = await Promise.race([
    page.waitForURL(/\/admin\/films$/, { timeout: 15_000 }).then(() => "admin" as const, () => null),
    wrong.waitFor({ timeout: 15_000 }).then(() => "no-account" as const, () => null),
  ]);
  if (outcome === "admin") return;
  expect(outcome, "ни входа, ни ошибки «Неверная эл. почта или пароль»").toBe("no-account");
  await register(page, E2E_ADMIN_EMAIL, ADMIN_PASSWORD, "/admin/films");
  await page.waitForURL(/\/admin\/films$/);
}

test.describe("Доступ к админке", () => {
  test("гость → вход с возвратом", async ({ page }) => {
    await page.goto("/admin/films");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fadmin%2Ffilms/);
  });

  test("обычный пользователь → главная, кнопки «Админка» нет", async ({ page }) => {
    await register(page, uniqueEmail("plain"));
    await page.goto("/admin/films/new");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Админка" })).toHaveCount(0);
  });

  test("администратор видит список и кнопку «Админка»", async ({ page }) => {
    await signInAsAdmin(page);
    await expect(page.getByRole("heading", { name: "Фильмы" }).locator("visible=true")).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Все · \d+$/ }).locator("visible=true")).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Админка" }).locator("visible=true")).toBeVisible();
  });
});

test.describe("Добавление фильма", () => {
  test("ошибки обязательных полей, публикация с постером, фильм на сайте", async ({ page }, testInfo) => {
    const p = isDesktop(testInfo) ? "d" : "f";
    const title = `Проверка ${Date.now()}`;
    await signInAsAdmin(page);
    await page.getByRole("link", { name: "Добавить фильм" }).locator("visible=true").click();
    await expect(page).toHaveURL(/\/admin\/films\/new$/);

    await page.getByRole("button", { name: "Опубликовать" }).locator("visible=true").click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Заполните обязательные поля: название, год, жанр" }).locator("visible=true"),
    ).toBeVisible();
    await expect(page.locator(`#${p}-title`)).toBeFocused();

    await page.locator(`#${p}-title`).fill(title);
    await page.locator(`#${p}-year`).fill("2026");
    await page.locator(`#${p}-dur`).fill("95");
    await page.getByRole("group", { name: "Жанры" }).locator("visible=true").getByRole("button", { name: "Детектив" }).click();
    await page.locator(`#${p}-desc`).fill("Детектив ищет пропавший трамвай.");
    await page.locator(`#${p}-poster`).setInputFiles({ name: "poster.png", mimeType: "image/png", buffer: pngBuffer() });

    // Живая карточка
    const slug = `proverka-${title.split(" ")[1]}`;
    await expect(page.getByText(`borisjaou.app/film/${slug}`).locator("visible=true")).toBeVisible();
    await expect(page.getByText("2026 · Детектив · 16+ · 1 ч 35 мин").locator("visible=true")).toBeVisible();
    await expect(page.getByRole("img", { name: "Постер фильма" }).locator("visible=true")).toBeVisible();

    await page.getByRole("button", { name: "Опубликовать" }).locator("visible=true").click();
    const dialog = page.getByRole("dialog", { name: "Фильм опубликован" });
    await expect(dialog).toContainText(`«${title}» уже в каталоге и в «Новинках». Ссылкой можно делиться.`);
    await dialog.getByRole("link", { name: "К списку" }).click();
    await page.waitForURL(/\/admin\/films$/);
    await expect(page.getByRole("listitem").filter({ hasText: title }).locator("visible=true")).toContainText("Опубликован");

    // На сайте: поиск и страница фильма с постером
    await page.goto("/?q=" + encodeURIComponent(title));
    await expect(catalogCards(page)).toHaveCount(1);
    await page.goto(`/film/${slug}`);
    await expect(page.getByRole("heading", { name: title }).locator("visible=true")).toBeVisible();
    const src = await page.locator('img[src*="/uploads/posters/"]').first().getAttribute("src");
    expect(src).toBeTruthy();
    expect((await page.request.get(src!)).headers()["content-type"]).toBe("image/png");
  });

  test("черновик не виден зрителям", async ({ page }, testInfo) => {
    const p = isDesktop(testInfo) ? "d" : "f";
    const title = `Черновик ${Date.now()}`;
    await signInAsAdmin(page);
    await page.goto("/admin/films/new");
    await page.locator(`#${p}-title`).fill(title);
    await page.locator(`#${p}-year`).fill("2025");
    await page.getByRole("group", { name: "Жанры" }).locator("visible=true").getByRole("button", { name: "Драма", exact: true }).click();
    await page.getByRole("button", { name: "В черновик" }).locator("visible=true").click();
    await expect(page.getByRole("dialog", { name: "Черновик сохранён" })).toBeVisible();

    const slug = `chernovik-${title.split(" ")[1]}`;
    expect((await page.request.get(`/film/${slug}`)).status()).toBe(404);
    const sitemap = await (await page.request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain(slug);
  });

  test("страницы админки не отдаются обычному пользователю (редирект в proxy)", async ({ page }) => {
    await register(page, uniqueEmail("nonadmin"));
    const res = await page.request.get("/admin/films/new", { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(res.status());
  });
});
