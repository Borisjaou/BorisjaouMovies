/**
 * Справочники из эталона (borisjaou-design-source/screens).
 * Порядок элементов = порядок в макетах.
 */

/** Genres.dc.html / DeskGenres.dc.html — полный список, 12 жанров */
export const GENRES = [
  "Драма",
  "Комедия",
  "Триллер",
  "Фантастика",
  "Анимация",
  "Приключения",
  "Ужасы",
  "Документальное",
  "Мелодрама",
  "Детектив",
  "Семейное",
  "Мюзикл",
] as const;
export type Genre = (typeof GENRES)[number];

/** Filters.dc.html / DeskCatalog.dc.html: DECADES */
export const DECADES = [
  { id: "2020s", label: "2020-е", from: 2020, to: 2029 },
  { id: "2010s", label: "2010-е", from: 2010, to: 2019 },
  { id: "2000s", label: "2000-е", from: 2000, to: 2009 },
  { id: "1990s", label: "1990-е", from: 1990, to: 1999 },
  { id: "earlier", label: "Раньше", from: 0, to: 1989 },
] as const;
export type DecadeId = (typeof DECADES)[number]["id"];

/** Длительность: ≤ 90 · 91–120 · > 120 минут */
export const DURATION_OPTIONS = [
  { id: "short", label: "До 90 мин", min: null, max: 90 },
  { id: "medium", label: "90–120", min: 91, max: 120 },
  { id: "long", label: "От 2 ч", min: 121, max: null },
] as const;
export type DurationOptionId = (typeof DURATION_OPTIONS)[number]["id"];

/** Страны из select в Filters / AdminAdd (без «Все страны» / «Не указана») */
export const COUNTRIES = ["Россия", "США", "Франция", "Южная Корея", "Япония"] as const;
export type Country = (typeof COUNTRIES)[number];

/** Сортировка каталога: подписи из Catalog / DeskCatalog */
export const SORT_OPTIONS = [
  { id: "popular", label: "Популярные" },
  { id: "new", label: "Новые" },
] as const;
export type SortId = (typeof SORT_OPTIONS)[number]["id"];

/** Базовый адрес ссылки на фильм (Movie: borisjaou.app/film/orbita-9) */
export const FILM_LINK_BASE = "borisjaou.app/film/";

/** Жанры в каталоге: чипы и панель фильтров (Catalog / DeskCatalog) — первые 6 */
export const CATALOG_GENRES: readonly Genre[] = GENRES.slice(0, 6);

/** Жанры на экране фильтров и в форме админки (Filters / AdminAdd) — первые 10 */
export const FILTER_GENRES: readonly Genre[] = GENRES.slice(0, 10);
