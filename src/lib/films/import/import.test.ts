import { describe, expect, it } from "vitest";
import { fitDescription, IMPORT_MESSAGES, mapGenres, type FetchFn } from "./common";
import { importFilm, parseFilmLink } from "./index";

/** Подменный fetch: ответы по началу адреса, записывает запросы */
function fakeFetch(routes: Record<string, unknown>, calls: string[] = []): FetchFn {
  return async (url, init) => {
    calls.push(`${url} ${JSON.stringify(init?.headers ?? {})}`);
    const key = Object.keys(routes).find((k) => url.startsWith(k));
    if (!key) return new Response("not found", { status: 404 });
    return Response.json(routes[key]);
  };
}

describe("parseFilmLink", () => {
  it("Кинопоиск, TMDB, IMDb", () => {
    expect(parseFilmLink("https://www.kinopoisk.ru/film/326/")).toEqual({ source: "kinopoisk", id: "326" });
    expect(parseFilmLink("https://www.kinopoisk.ru/series/464963/?utm=1")).toEqual({ source: "kinopoisk", id: "464963" });
    expect(parseFilmLink("https://www.themoviedb.org/movie/603-the-matrix?language=ru")).toEqual({
      source: "tmdb",
      kind: "movie",
      id: "603",
    });
    expect(parseFilmLink("https://www.themoviedb.org/tv/1396")).toEqual({ source: "tmdb", kind: "tv", id: "1396" });
    expect(parseFilmLink("https://m.imdb.com/title/tt0133093/")).toEqual({ source: "imdb", id: "tt0133093" });
  });

  it("чужие и битые ссылки", () => {
    expect(parseFilmLink("kinopoisk.ru/film/326")).toBeNull();
    expect(parseFilmLink("https://evil.example/film/326/")).toBeNull();
    expect(parseFilmLink("https://kinopoisk.ru.evil.example/film/326/")).toBeNull();
    expect(parseFilmLink("javascript:alert(1)")).toBeNull();
  });
});

describe("mapGenres / fitDescription", () => {
  it("жанры источника → жанры каталога в порядке справочника", () => {
    expect(mapGenres(["фантастика", "драма", "боевик"])).toEqual(["Драма", "Фантастика"]);
    expect(mapGenres(["мультфильм", "семейный", "мелодрама", "НФ и Фэнтези", "Боевик и Приключения"])).toEqual([
      "Фантастика",
      "Анимация",
      "Приключения",
      "Мелодрама",
      "Семейное",
    ]);
  });

  it("длинное описание обрезается по предложению", () => {
    const text = `${"Первое предложение. ".repeat(40)}Хвост`;
    const out = fitDescription(text, 100);
    expect(out.length).toBeLessThanOrEqual(100);
    expect(out.endsWith(".")).toBe(true);
    expect(fitDescription("  коротко  ")).toBe("коротко");
  });
});

describe("importFilm", () => {
  it("Кинопоиск: поля, режиссёр, актёры, трейлер YouTube", async () => {
    const calls: string[] = [];
    const fetchFn = fakeFetch(
      {
        "https://kinopoiskapiunofficial.tech/api/v2.2/films/326/videos": {
          items: [
            { url: "https://widgets.kinopoisk.ru/x", name: "Трейлер", site: "KINOPOISK_WIDGET" },
            { url: "https://www.youtube.com/watch?v=abc", name: "Трейлер (дублированный)", site: "YOUTUBE" },
          ],
        },
        "https://kinopoiskapiunofficial.tech/api/v2.2/films/326": {
          nameRu: "Побег из Шоушенка",
          nameOriginal: "The Shawshank Redemption",
          year: 1994,
          filmLength: 142,
          description: "Бухгалтер Энди Дюфрейн обвинён в убийстве.",
          posterUrl: "https://kinopoiskapiunofficial.tech/images/posters/kp/326.jpg",
          countries: [{ country: "США" }],
          genres: [{ genre: "драма" }],
        },
        "https://kinopoiskapiunofficial.tech/api/v1/staff": [
          { nameRu: "Фрэнк Дарабонт", professionKey: "DIRECTOR" },
          { nameRu: "Тим Роббинс", professionKey: "ACTOR" },
          { nameRu: "", nameEn: "Morgan Freeman", professionKey: "ACTOR" },
          { nameRu: "Стивен Кинг", professionKey: "WRITER" },
        ],
      },
      calls,
    );
    const film = await importFilm("https://www.kinopoisk.ru/film/326/", { kinopoisk: "kp-key" }, fetchFn);
    expect(film).toEqual({
      title: "Побег из Шоушенка",
      originalTitle: "The Shawshank Redemption",
      year: "1994",
      durationMin: "142",
      genres: ["Драма"],
      country: "США",
      director: "Фрэнк Дарабонт",
      cast: "Тим Роббинс, Morgan Freeman",
      description: "Бухгалтер Энди Дюфрейн обвинён в убийстве.",
      trailerUrl: "https://www.youtube.com/watch?v=abc",
      posterUrl: "https://kinopoiskapiunofficial.tech/images/posters/kp/326.jpg",
      source: "kinopoisk",
    });
    expect(calls.every((c) => c.includes('"X-API-KEY":"kp-key"'))).toBe(true);
  });

  it("IMDb → TMDB: поиск по номеру, токен в заголовке, страна по-русски", async () => {
    const calls: string[] = [];
    const fetchFn = fakeFetch(
      {
        "https://api.themoviedb.org/3/find/tt0133093": { movie_results: [{ id: 603 }], tv_results: [] },
        "https://api.themoviedb.org/3/movie/603": {
          title: "Матрица",
          original_title: "The Matrix",
          release_date: "1999-03-30",
          runtime: 136,
          overview: "Жизнь Томаса Андерсона разделена на две части.",
          poster_path: "/abc.jpg",
          genres: [{ name: "боевик" }, { name: "фантастика" }],
          production_countries: [{ iso_3166_1: "US" }],
          credits: {
            cast: [
              { name: "Carrie-Anne Moss", order: 2 },
              { name: "Keanu Reeves", order: 0 },
            ],
            crew: [
              { name: "Lana Wachowski", job: "Director" },
              { name: "Lilly Wachowski", job: "Director" },
              { name: "Joel Silver", job: "Producer" },
            ],
          },
          videos: { results: [{ key: "en1", site: "YouTube", type: "Trailer", iso_639_1: "en" }, { key: "ru1", site: "YouTube", type: "Trailer", iso_639_1: "ru" }] },
        },
      },
      calls,
    );
    const film = await importFilm("https://www.imdb.com/title/tt0133093/", { tmdb: "eyJtoken" }, fetchFn);
    expect(film).toMatchObject({
      title: "Матрица",
      originalTitle: "The Matrix",
      year: "1999",
      durationMin: "136",
      genres: ["Фантастика"],
      country: "США",
      director: "Lana Wachowski, Lilly Wachowski",
      cast: "Keanu Reeves, Carrie-Anne Moss",
      trailerUrl: "https://www.youtube.com/watch?v=ru1",
      posterUrl: "https://image.tmdb.org/t/p/w780/abc.jpg",
      source: "tmdb",
    });
    expect(calls.every((c) => c.includes('"Authorization":"Bearer eyJtoken"'))).toBe(true);
  });

  it("понятные ошибки: нет ключа, чужая ссылка, не найден", async () => {
    await expect(importFilm("https://www.kinopoisk.ru/film/1/", {})).rejects.toThrow(IMPORT_MESSAGES.noKinopoiskKey);
    await expect(importFilm("https://www.themoviedb.org/movie/1", {})).rejects.toThrow(IMPORT_MESSAGES.noTmdbKey);
    await expect(importFilm("https://example.com/", { tmdb: "k" })).rejects.toThrow(IMPORT_MESSAGES.badLink);
    await expect(importFilm("https://www.themoviedb.org/movie/1", { tmdb: "k" }, fakeFetch({}))).rejects.toThrow(
      IMPORT_MESSAGES.notFound,
    );
  });
});
