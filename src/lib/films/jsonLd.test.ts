import { describe, expect, it } from "vitest";
import { FILMS } from "./data";
import { filmJsonLd, serializeJsonLd } from "./jsonLd";

describe("filmJsonLd", () => {
  it("Movie с длительностью ISO 8601 и жанрами", () => {
    const film = { ...FILMS[0], id: 1, durationMin: 128 };
    const ld = filmJsonLd(film);
    expect(ld["@type"]).toBe("Movie");
    expect(ld.duration).toBe("PT2H8M");
    expect(ld.genre).toEqual(film.genres);
    expect(String(ld.url)).toMatch(/\/film\//);
  });

  it("экранирует «<» — данные не закроют тег script", () => {
    expect(serializeJsonLd({ name: "</script><script>alert(1)</script>" })).not.toContain("<");
  });
});
