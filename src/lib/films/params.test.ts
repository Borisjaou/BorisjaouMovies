import { describe, expect, it } from "vitest";
import {
  EMPTY_QUERY,
  catalogHref,
  parseCatalogQuery,
  searchParamsToRecord,
  stringifyCatalogQuery,
  toFilmFilters,
} from "./params";

describe("parseCatalogQuery", () => {
  it("пустой URL → значения по умолчанию", () => {
    expect(parseCatalogQuery({})).toEqual({ ...EMPTY_QUERY, yearFrom: undefined, yearTo: undefined, rating: undefined, duration: undefined, country: undefined });
  });

  it("разбирает все параметры и повторяющиеся ключи", () => {
    const q = parseCatalogQuery({
      q: "орбита",
      genre: ["Драма", "Фантастика"],
      decade: ["2020s", "2010s"],
      from: "2010",
      to: "2026",
      rating: "7",
      duration: "long",
      age: ["16+", "18+"],
      country: "США",
      sort: "rating",
      fav: "1",
    });
    expect(q).toEqual({
      q: "орбита",
      genres: ["Драма", "Фантастика"],
      decades: ["2020s", "2010s"],
      yearFrom: 2010,
      yearTo: 2026,
      rating: "7",
      duration: "long",
      ages: ["16+", "18+"],
      country: "США",
      sort: "rating",
      fav: true,
    });
  });

  it("отбрасывает неизвестные значения", () => {
    const q = parseCatalogQuery({
      genre: ["Драма", "Вестерн"],
      decade: "1970s",
      from: "20x0",
      rating: "any",
      duration: "huge",
      age: "21+",
      country: "Марс",
      sort: "abc",
      fav: "yes",
    });
    expect(q.genres).toEqual(["Драма"]);
    expect(q.decades).toEqual([]);
    expect(q.yearFrom).toBeUndefined();
    expect(q.rating).toBeUndefined();
    expect(q.duration).toBeUndefined();
    expect(q.ages).toEqual([]);
    expect(q.country).toBeUndefined();
    expect(q.sort).toBe("popular");
    expect(q.fav).toBe(false);
  });
});

describe("stringifyCatalogQuery / catalogHref", () => {
  it("значения по умолчанию не пишутся", () => {
    expect(stringifyCatalogQuery(EMPTY_QUERY)).toBe("");
    expect(catalogHref(EMPTY_QUERY)).toBe("/");
  });

  it("туда и обратно без потерь", () => {
    const query = parseCatalogQuery({ q: "кит", genre: ["Анимация", "Драма"], decade: "2020s", rating: "8", sort: "new", fav: "1" });
    const back = parseCatalogQuery(searchParamsToRecord(new URLSearchParams(stringifyCatalogQuery(query))));
    expect(back).toEqual(query);
  });

  it("поиск обрезается по краям", () => {
    expect(stringifyCatalogQuery({ ...EMPTY_QUERY, q: "  кит " })).toBe("q=%D0%BA%D0%B8%D1%82");
  });
});

describe("toFilmFilters", () => {
  it("переносит все поля, кроме режима «Избранное»", () => {
    const f = toFilmFilters({ ...EMPTY_QUERY, q: "a", genres: ["Драма"], rating: "7", sort: "rating", fav: true });
    expect(f).toMatchObject({ query: "a", genres: ["Драма"], rating: "7", sort: "rating" });
    expect(f).not.toHaveProperty("fav");
  });
});
