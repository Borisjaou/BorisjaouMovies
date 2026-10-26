import { expect, test } from "@playwright/test";

test.describe("Поделиться", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("окно: ссылка, копирование, соцсети, закрытие по Escape", async ({ page }) => {
    await page.goto("/film/orbita-9");
    const open = page.getByRole("button", { name: /Поделиться/ }).locator("visible=true").first();
    await open.click();
    const dialog = page.getByRole("dialog", { name: "Поделиться фильмом" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Ссылка на фильм")).toHaveValue(/\/film\/orbita-9$/);

    await dialog.getByRole("button", { name: "Копировать" }).click();
    await expect(dialog.getByRole("button", { name: "Скопировано" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/film\/orbita-9$/);

    await expect(dialog.getByRole("link", { name: "Telegram" })).toHaveAttribute("href", /^https:\/\/t\.me\/share\/url\?url=/);
    await expect(dialog.getByRole("link", { name: "ВКонтакте" })).toHaveAttribute("href", /^https:\/\/vk\.com\/share\.php/);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
  });

  test("фокус не уходит из окна по Tab", async ({ page }) => {
    await page.goto("/film/orbita-9");
    await page.getByRole("button", { name: /Поделиться/ }).locator("visible=true").first().click();
    const dialog = page.getByRole("dialog", { name: "Поделиться фильмом" });
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
  });

  test("OG-картинка и метаданные фильма", async ({ page, request }) => {
    await page.goto("/film/orbita-9");
    await expect(page).toHaveTitle("Орбита 9 — Borisjaou");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
    const og = await request.get("/film/orbita-9/opengraph-image");
    expect(og.status()).toBe(200);
    expect(og.headers()["content-type"]).toContain("image/png");
  });
});
