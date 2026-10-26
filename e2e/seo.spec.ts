import { expect, test } from "@playwright/test";

test.describe("SEO", () => {
  test("robots.txt и sitemap.xml", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toMatch(/Sitemap: http.*\/sitemap\.xml/);

    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/film/orbita-9</loc>");
    expect(sitemap).toContain("/genres</loc>");
    expect(sitemap).not.toContain("/admin");
  });

  test("метаданные: canonical, noindex у служебных страниц, JSON-LD фильма", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^http:\/\/localhost:\d+\/?$/);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    await page.goto("/?q=test");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    await page.goto("/login");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    await page.goto("/film/orbita-9");
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
    expect(ld).toMatchObject({ "@type": "Movie", name: "Орбита 9" });
  });

  test("404 для неизвестной страницы", async ({ page }) => {
    const res = await page.goto("/net-takoy-stranitsy");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
  });
});
