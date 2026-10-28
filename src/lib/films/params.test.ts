import { describe, expect, it } from "vitest";
import {
  EMPTY_QUERY,
  catalogHref,
  parseCatalogQuery,
  searchParamsToRecord,
  shelfOf,
  stringifyCatalogQuery,
  toFilmFilters,
  withShelf,
} from "./params";

describe("parseCatalogQuery", () => {
  it("пустой URL → значения по умолчанию", () => {
    expect(parseCatalogQuery({})).toEqual({ ...EMPTY_QUERY, yearFrom: undefined, yearTo: undefined, duration: undefined, country: undefined, list: undefined });
  });

  it("разбирает все параметры и повторяющиеся ключи", () => {
    const q = parseCatalogQuery({
      q: "орбита",
      genre: ["Драма", "Фантастика"],
      decade: ["2020s", "2010s"],
      from: "2010",
      to: "2026",
      duration: "long",
      country: "США",
      sort: "new",
      fav: "1",
    });
    expect(q).toEqual({
      q: "орбита",
      genres: ["Драма", "Фантастика"],
      decades: ["2020s", "2010s"],
      yearFrom: 2010,
      yearTo: 2026,
      duration: "long",
      country: "США",
      sort: "new",
      fav: true,
      list: undefined,
    });
  });

  it("отбрасывает неизвестные значения", () => {
    const q = parseCatalogQuery({
      genre: ["Драма", "Вестерн"],
      decade: "1970s",
      from: "20x0",
      duration: "huge",
      country: "Марс",
      list: "later",
      sort: "abc",
      fav: "yes",
    });
    expect(q.genres).toEqual(["Драма"]);
    expect(q.decades).toEqual([]);
    expect(q.yearFrom).toBeUndefined();
    expect(q.duration).toBeUndefined();
    expect(q.list).toBeUndefined();
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
    const query = parseCatalogQuery({ q: "кит", genre: ["Анимация", "Драма"], decade: "2020s", sort: "new", fav: "1" });
    const back = parseCatalogQuery(searchParamsToRecord(new URLSearchParams(stringifyCatalogQuery(query))));
    expect(back).toEqual(query);
  });

  it("поиск обрезается по краям", () => {
    expect(stringifyCatalogQuery({ ...EMPTY_QUERY, q: "  кит " })).toBe("q=%D0%BA%D0%B8%D1%82");
  });
});

describe("Списки просмотра в URL", () => {
  it("list=watchlist / watched; вместе с fav=1 побеждает избранное", () => {
    expect(parseCatalogQuery({ list: "watched" }).list).toBe("watched");
    expect(shelfOf(parseCatalogQuery({ list: "watchlist" }))).toBe("watchlist");
    expect(shelfOf(parseCatalogQuery({ list: "watchlist", fav: "1" }))).toBe("favorites");
    expect(shelfOf(EMPTY_QUERY)).toBeNull();
  });

  it("withShelf переключает режим и пишется в адрес", () => {
    expect(catalogHref(withShelf(EMPTY_QUERY, "watched"))).toBe("/?list=watched");
    expect(catalogHref(withShelf(withShelf(EMPTY_QUERY, "watched"), "favorites"))).toBe("/?fav=1");
    expect(catalogHref(withShelf(withShelf(EMPTY_QUERY, "watched"), null))).toBe("/");
  });
});

describe("toFilmFilters", () => {
  it("переносит все поля, кроме режима «Избранное»", () => {
    const f = toFilmFilters({ ...EMPTY_QUERY, q: "a", genres: ["Драма"], duration: "short", sort: "new", fav: true });
    expect(f).toMatchObject({ query: "a", genres: ["Драма"], duration: "short", sort: "new" });
    expect(f).not.toHaveProperty("fav");
    expect(f).not.toHaveProperty("list");
  });
});
