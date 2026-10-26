import { describe, expect, it } from "vitest";
import { displayUrl, filmUrl, shareUrls } from "./site";

describe("site", () => {
  it("ссылка на фильм и её вид в поле", () => {
    expect(filmUrl("orbita-9")).toBe("https://borisjaou.app/film/orbita-9");
    expect(displayUrl(filmUrl("orbita-9"))).toBe("borisjaou.app/film/orbita-9");
  });

  it("share-URL сервисов кодируют ссылку и название", () => {
    const urls = shareUrls("https://borisjaou.app/film/orbita-9", "Орбита 9");
    expect(urls.telegram).toBe(
      "https://t.me/share/url?url=https%3A%2F%2Fborisjaou.app%2Ffilm%2Forbita-9&text=%D0%9E%D1%80%D0%B1%D0%B8%D1%82%D0%B0%209",
    );
    expect(urls.whatsapp.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(urls.whatsapp.split("text=")[1])).toBe("Орбита 9 https://borisjaou.app/film/orbita-9");
    expect(urls.vk).toContain("https://vk.com/share.php?url=https%3A%2F%2Fborisjaou.app%2Ffilm%2Forbita-9");
    expect(urls.mail.startsWith("mailto:?subject=")).toBe(true);
  });
});
