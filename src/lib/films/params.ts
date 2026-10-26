/**
 * Состояние каталога в URL: /?q=…&genre=…&decade=…&from=…&to=…&rating=…&duration=…&age=…&country=…&sort=…&fav=1
 * Многозначные параметры повторяются: ?genre=Драма&genre=Комедия
 */
import {
  AGE_RATINGS,
  COUNTRIES,
  DECADES,
  DURATION_OPTIONS,
  GENRES,
  RATING_OPTIONS,
  SORT_OPTIONS,
  type AgeRating,
  type Country,
  type DecadeId,
  type DurationOptionId,
  type Genre,
  type RatingOptionId,
  type SortId,
} from "./constants";
import type { FilmFilters } from "./types";

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

export interface CatalogQuery {
  q: string;
  genres: Genre[];
  decades: DecadeId[];
  yearFrom?: number;
  yearTo?: number;
  /** undefined — «Любой» */
  rating?: Exclude<RatingOptionId, "any">;
  duration?: DurationOptionId;
  ages: AgeRating[];
  country?: Country;
  sort: SortId;
  /** Режим «Избранное» на ПК */
  fav: boolean;
}

export const EMPTY_QUERY: CatalogQuery = {
  q: "",
  genres: [],
  decades: [],
  ages: [],
  sort: "popular",
  fav: false,
};

const KEYS = {
  q: "q",
  genre: "genre",
  decade: "decade",
  from: "from",
  to: "to",
  rating: "rating",
  duration: "duration",
  age: "age",
  country: "country",
  sort: "sort",
  fav: "fav",
} as const;

function all(sp: SearchParamsRecord, key: string): string[] {
  const v = sp[key];
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function first(sp: SearchParamsRecord, key: string): string | undefined {
  return all(sp, key)[0];
}

function oneOf<T extends string>(allowed: readonly T[], value: string | undefined): T | undefined {
  return allowed.find((a) => a === value);
}

function manyOf<T extends string>(allowed: readonly T[], values: string[]): T[] {
  return allowed.filter((a) => values.includes(a));
}

function year(value: string | undefined): number | undefined {
  if (!value || !/^\d{4}$/.test(value)) return undefined;
  return Number(value);
}

const RATING_IDS = RATING_OPTIONS.map((o) => o.id).filter(
  (id): id is Exclude<RatingOptionId, "any"> => id !== "any",
);

export function parseCatalogQuery(sp: SearchParamsRecord): CatalogQuery {
  return {
    q: (first(sp, KEYS.q) ?? "").slice(0, 100),
    genres: manyOf(GENRES, all(sp, KEYS.genre)),
    decades: manyOf(
      DECADES.map((d) => d.id),
      all(sp, KEYS.decade),
    ),
    yearFrom: year(first(sp, KEYS.from)),
    yearTo: year(first(sp, KEYS.to)),
    rating: oneOf(RATING_IDS, first(sp, KEYS.rating)),
    duration: oneOf(
      DURATION_OPTIONS.map((d) => d.id),
      first(sp, KEYS.duration),
    ),
    ages: manyOf(AGE_RATINGS, all(sp, KEYS.age)),
    country: oneOf(COUNTRIES, first(sp, KEYS.country)),
    sort:
      oneOf(
        SORT_OPTIONS.map((s) => s.id),
        first(sp, KEYS.sort),
      ) ?? "popular",
    fav: first(sp, KEYS.fav) === "1",
  };
}

/** URLSearchParams из браузера → тот же разбор, что и на сервере */
export function searchParamsToRecord(params: URLSearchParams): SearchParamsRecord {
  const record: SearchParamsRecord = {};
  for (const key of new Set(params.keys())) {
    record[key] = params.getAll(key);
  }
  return record;
}

/** Строка запроса без «?»; значения по умолчанию не пишутся */
export function stringifyCatalogQuery(query: CatalogQuery): string {
  const p = new URLSearchParams();
  const q = query.q.trim();
  if (q) p.set(KEYS.q, q);
  query.genres.forEach((g) => p.append(KEYS.genre, g));
  query.decades.forEach((d) => p.append(KEYS.decade, d));
  if (query.yearFrom !== undefined) p.set(KEYS.from, String(query.yearFrom));
  if (query.yearTo !== undefined) p.set(KEYS.to, String(query.yearTo));
  if (query.rating) p.set(KEYS.rating, query.rating);
  if (query.duration) p.set(KEYS.duration, query.duration);
  query.ages.forEach((a) => p.append(KEYS.age, a));
  if (query.country) p.set(KEYS.country, query.country);
  if (query.sort !== "popular") p.set(KEYS.sort, query.sort);
  if (query.fav) p.set(KEYS.fav, "1");
  return p.toString();
}

export function catalogHref(query: CatalogQuery, path = "/"): string {
  const s = stringifyCatalogQuery(query);
  return s ? `${path}?${s}` : path;
}

export function toFilmFilters(query: CatalogQuery): FilmFilters {
  return {
    query: query.q,
    genres: query.genres,
    decades: query.decades,
    yearFrom: query.yearFrom,
    yearTo: query.yearTo,
    rating: query.rating,
    duration: query.duration,
    ages: query.ages,
    country: query.country,
    sort: query.sort,
  };
}
