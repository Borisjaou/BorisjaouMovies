import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { createTestDb } from "@/test/db";
import { FILMS } from "./data";
import { toFilmData } from "./mapper";
import { createFilmsRepository, type FilmsRepository } from "./repository";
import type { Film, FilmFilters } from "./types";

let db: PrismaClient;
let repo: FilmsRepository;
let cleanup: () => Promise<void>;

beforeAll(async () => {
  ({ db, cleanup } = await createTestDb());
  repo = createFilmsRepository(db);
});
afterAll(() => cleanup());

const titles = async (filters: FilmFilters = {}) => (await repo.getFilms(filters)).items.map((f) => f.title);
const count = async (filters: FilmFilters = {}) => (await repo.getFilms(filters)).total;

/** Временные фильмы для граничных случаев — удаляются после теста */
const extraIds: number[] = [];
async function addFilms(patches: Partial<Film>[]) {
  for (const [i, patch] of patches.entries()) {
    const id = 900 + extraIds.length + i;
    const film: Film = { ...FILMS[0], id, slug: `test-${id}`, title: `Тест ${id}`, ...patch };
    await db.film.create({ data: { id, ...toFilmData(film), genres: { create: film.genres.map((genre, position) => ({ genre, position })) } } });
  }
  extraIds.push(...patches.map((_, i) => 900 + extraIds.length + i));
}
afterEach(async () => {
  if (extraIds.length) await db.film.deleteMany({ where: { id: { in: extraIds.splice(0) } } });
});

describe("getFilms — статус", () => {
  it("по умолчанию только опубликованные (10 из 11)", async () => {
    const page = await repo.getFilms();
    expect(page.total).toBe(10);
    expect(page.items.every((f) => f.status === "published")).toBe(true);
  });

  it("status: all — все 11, draft — только черновик", async () => {
    expect(await count({ status: "all" })).toBe(11);
    expect(await titles({ status: "draft" })).toEqual(["Без названия (черновик)"]);
  });
});

describe("getFilms — сортировка", () => {
  it("Популярные (по умолчанию)", async () => {
    expect(await titles()).toEqual([
      "Орбита 9", "Тихий берег", "Лимонное лето", "Код тишины", "Бумажный кит",
      "Северный ветер", "Город в тумане", "Звёздная пыль", "Ночная смена", "Весёлый переполох",
    ]);
  });

  it("Новые — при равном годе сохраняется порядок данных", async () => {
    expect(await titles({ sort: "new" })).toEqual([
      "Тихий берег", "Лимонное лето", "Орбита 9", "Северный ветер", "Код тишины",
      "Бумажный кит", "Ночная смена", "Город в тумане", "Звёздная пыль", "Весёлый переполох",
    ]);
  });
});

describe("getFilms — поиск", () => {
  it("по названию без учёта регистра, в том числе кириллицы", async () => {
    expect(await titles({ query: "ОРБ" })).toEqual(["Орбита 9"]);
    expect(await titles({ query: "  берег " })).toEqual(["Тихий берег"]);
  });

  it("по режиссёру и актёрам", async () => {
    expect(await titles({ query: "[имя режиссёра]" })).toEqual(["Орбита 9"]);
    expect(await titles({ query: "актёр 2" })).toEqual(["Орбита 9"]);
  });

  it("пустой запрос не фильтрует, ничего не найдено", async () => {
    expect(await count({ query: "   " })).toBe(10);
    expect(await titles({ query: "нет такого" })).toEqual([]);
  });
});

describe("getFilms — жанры", () => {
  it("любой из выбранных; учитываются все жанры фильма", async () => {
    expect(await titles({ genres: ["Драма"] })).toEqual(["Орбита 9", "Тихий берег", "Город в тумане"]);
    expect(await titles({ genres: ["Комедия", "Анимация"] })).toEqual(["Лимонное лето", "Бумажный кит", "Весёлый переполох"]);
    expect(await count({ genres: [] })).toBe(10);
  });

  it("порядок жанров фильма сохраняется", async () => {
    expect((await repo.getFilmBySlug("orbita-9"))?.genres).toEqual(["Фантастика", "Драма"]);
  });
});

describe("getFilms — годы", () => {
  it("десятилетия: любое из выбранных", async () => {
    expect(await titles({ decades: ["2010s"] })).toEqual(["Город в тумане", "Звёздная пыль", "Весёлый переполох"]);
    expect(await count({ decades: ["2020s"] })).toBe(7);
    expect(await count({ decades: ["2020s", "2010s"] })).toBe(10);
    expect(await count({ decades: ["1990s", "earlier"] })).toBe(0);
  });

  it("границы десятилетий", async () => {
    await addFilms([{ year: 1989 }, { year: 1990 }, { year: 1999 }]);
    expect((await repo.getFilms({ decades: ["1990s"] })).items.map((f) => f.year)).toEqual([1990, 1999]);
    expect((await repo.getFilms({ decades: ["earlier"] })).items.map((f) => f.year)).toEqual([1989]);
  });

  it("С / По включительно", async () => {
    expect(await count({ yearFrom: 2020, yearTo: 2026 })).toBe(7);
    expect(await titles({ yearFrom: 2025, yearTo: 2025 })).toEqual(["Тихий берег", "Лимонное лето"]);
  });
});

describe("getFilms — длительность, страна", () => {
  it("длительность: ≤ 90 · 91–120 · > 120", async () => {
    await addFilms([90, 91, 120, 121].map((d) => ({ durationMin: d, popularity: -d })));
    const mins = async (duration: FilmFilters["duration"]) =>
      (await repo.getFilms({ duration })).items.map((f) => f.durationMin).sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(await mins("short")).toEqual([90]);
    expect(await mins("medium")).toEqual([91, 120]);
    expect(await mins("long")).toEqual([121, 128]);
  });

  it("без длительности / страны фильм не проходит фильтр", async () => {
    expect(await titles({ duration: "long" })).toEqual(["Орбита 9"]);
    await addFilms([{ country: "США" }, { country: "Франция" }]);
    expect((await repo.getFilms({ country: "США" })).items.map((f) => f.country)).toEqual(["США"]);
  });

  it("фильтры складываются через И", async () => {
    expect(await titles({ genres: ["Фантастика"], duration: "long" })).toEqual(["Орбита 9"]);
    expect(await count({ genres: ["Фантастика"], decades: ["2020s"], duration: "short" })).toBe(0);
  });
});

describe("getFilms — пагинация по 20 и выборка по id", () => {
  it("страницы", async () => {
    await addFilms(Array.from({ length: 25 }, (_, i) => ({ popularity: -100 - i })));
    const p1 = await repo.getFilms();
    const p2 = await repo.getFilms({}, { page: 2 });
    expect([p1.items.length, p1.total, p1.hasMore]).toEqual([20, 35, true]);
    expect([p2.items.length, p2.page, p2.hasMore]).toEqual([15, 2, false]);
    expect(new Set([...p1.items, ...p2.items].map((f) => f.id)).size).toBe(35);
    expect((await repo.getFilms({}, { page: 0, pageSize: 5 })).items).toHaveLength(5);
  });

  it("ids + фильтры + сортировка", async () => {
    expect(await titles({ ids: [8, 5, 2, 999] })).toEqual(["Орбита 9", "Бумажный кит", "Звёздная пыль"]);
    expect(await titles({ ids: [8, 5, 2], sort: "new" })).toEqual(["Орбита 9", "Бумажный кит", "Звёздная пыль"]);
    expect(await titles({ ids: [8, 5, 2], genres: ["Фантастика"] })).toEqual(["Орбита 9", "Звёздная пыль"]);
    expect(await titles({ ids: [11] })).toEqual([]);
  });
});

describe("getFilmBySlug / getNewFilms / getSimilarFilms", () => {
  it("getFilmBySlug: опубликованный, черновик — только с includeDrafts, неизвестный", async () => {
    const orbita = await repo.getFilmBySlug("orbita-9");
    expect(orbita).toMatchObject({ title: "Орбита 9", durationMin: 128, cast: ["[Актёр 1]", "[Актёр 2]", "[Актёр 3]"] });
    expect(await repo.getFilmBySlug("bez-nazvaniya-chernovik")).toBeNull();
    expect((await repo.getFilmBySlug("bez-nazvaniya-chernovik", { includeDrafts: true }))?.status).toBe("draft");
    expect(await repo.getFilmBySlug("net-takogo")).toBeNull();
  });

  it("getNewFilms: опубликованные с isNew в порядке данных, limit 3", async () => {
    expect((await repo.getNewFilms()).map((f) => f.title)).toEqual(["Тихий берег", "Орбита 9", "Лимонное лето", "Северный ветер"]);
    expect((await repo.getNewFilms(3)).map((f) => f.title)).toEqual(["Тихий берег", "Орбита 9", "Лимонное лето"]);
  });

  it("getSimilarFilms: общие жанры, затем популярность; без самого фильма и черновиков", async () => {
    const orbita = await repo.getFilmBySlug("orbita-9");
    if (!orbita) throw new Error("нет данных");
    expect((await repo.getSimilarFilms(orbita)).map((f) => f.title)).toEqual([
      "Тихий берег", "Город в тумане", "Звёздная пыль", "Лимонное лето", "Код тишины",
    ]);
    expect(await repo.getSimilarFilms(orbita, 2)).toHaveLength(2);
  });

  it("getPublishedSlugs", async () => {
    expect(await repo.getPublishedSlugs()).toHaveLength(10);
  });

  it("данные после записи в базу совпадают с исходными", async () => {
    for (const film of FILMS) {
      expect(await repo.getFilmBySlug(film.slug, { includeDrafts: true })).toEqual({ ...film, originalTitle: undefined, posterUrl: undefined, trailerUrl: undefined });
    }
  });
});

describe("«Яма»: ИМХО «не понравился»", () => {
  it("скрыта из каталога, новинок и похожих; видна в pit и по ids", async () => {
    await addFilms([
      { title: "В яме", verdict: "disliked", imho: "Скучно", isNew: true, popularity: 100 },
      { title: "Понравился", verdict: "liked", popularity: 99 },
    ]);
    const catalog = await titles({});
    expect(catalog).toContain("Понравился");
    expect(catalog).not.toContain("В яме");
    expect(await titles({ pit: true })).toEqual(["В яме"]);
    expect((await repo.getNewFilms()).map((f) => f.title)).not.toContain("В яме");
    const orbita = await repo.getFilmBySlug("orbita-9");
    if (!orbita) throw new Error("нет данных");
    expect((await repo.getSimilarFilms(orbita, 20)).map((f) => f.title)).not.toContain("В яме");

    const pitFilm = (await repo.getFilms({ pit: true })).items[0];
    expect(await titles({ ids: [pitFilm.id] })).toEqual(["В яме"]);
    expect(pitFilm).toMatchObject({ verdict: "disliked", imho: "Скучно" });
    // Страница фильма из «Ямы» открывается
    expect(await repo.getFilmBySlug(pitFilm.slug)).not.toBeNull();
  });
});
