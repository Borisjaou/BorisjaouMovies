import { describe, expect, it } from "vitest";
import { FILMS } from "./data";
import { DEFAULT_SLUG, slugify } from "./slugify";

describe("slugify", () => {
  it("совпадает со slug всех фильмов из эталона", () => {
    for (const film of FILMS) {
      expect(slugify(film.title)).toBe(film.slug);
    }
  });

  it("транслитерирует кириллицу по таблице эталона", () => {
    expect(slugify("Орбита 9")).toBe("orbita-9");
    expect(slugify("Щука ёж")).toBe("schuka-ezh");
    expect(slugify("Цвет чая")).toBe("tsvet-chaya");
    expect(slugify("Юла")).toBe("yula");
  });

  it("выкидывает ъ и ь", () => {
    expect(slugify("Объявление")).toBe("obyavlenie");
    expect(slugify("Пыль")).toBe("pyl");
  });

  it("сворачивает пробелы и знаки в один дефис и обрезает края", () => {
    expect(slugify("  Привет,  мир!  ")).toBe("privet-mir");
    expect(slugify("«Орбита» — 9")).toBe("orbita-9");
  });

  it("оставляет латиницу и цифры", () => {
    expect(slugify("Film 2 Часть")).toBe("film-2-chast");
  });

  it("возвращает novyy-film, если ничего не осталось", () => {
    expect(slugify("")).toBe(DEFAULT_SLUG);
    expect(slugify("!!! ???")).toBe(DEFAULT_SLUG);
    expect(DEFAULT_SLUG).toBe("novyy-film");
  });
});
