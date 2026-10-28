import type { DecadeId, DurationOptionId, Genre, SortId } from "./constants";

export type FilmStatus = "published" | "draft";

/** Номер цвета постера 1–6 = posters[0..5] в THEMES (--poster-0 … --poster-5) */
export type PosterColor = 1 | 2 | 3 | 4 | 5 | 6;

/** Вариант декоративной фигуры на постере = SHAPES[0..2] в Catalog / DeskCatalog */
export type PosterShape = 0 | 1 | 2;

export interface Film {
  id: number;
  slug: string;
  title: string;
  originalTitle?: string;
  year: number;
  /** Первый жанр показывается в карточке («2024 · Фантастика») */
  genres: Genre[];
  durationMin: number | null;
  country: string | null;
  director: string | null;
  cast: string[];
  /** Короткий текст для карточек каталога, «Новинок», «Похожих» */
  shortDescription: string;
  /** Полный текст для страницы фильма («О фильме») */
  description: string;
  posterColor: PosterColor;
  posterShape: PosterShape;
  posterUrl?: string;
  /** «Ссылка на трейлер» из формы админки (AdminAdd) */
  trailerUrl?: string;
  /** «Показать в «Новинках»» */
  isNew: boolean;
  status: FilmStatus;
  /** Для сортировки «Популярные» (pop в эталоне) */
  popularity: number;
}

export interface FilmFilters {
  /** Поиск: название, режиссёр, актёры */
  query?: string;
  /** Любой из выбранных жанров */
  genres?: readonly Genre[];
  /** Любое из выбранных десятилетий */
  decades?: readonly DecadeId[];
  /** Годы выпуска «С» / «По» (Filters.dc.html), включительно */
  yearFrom?: number;
  yearTo?: number;
  duration?: DurationOptionId;
  /** Страна; undefined — «Все страны» */
  country?: string;
  sort?: SortId;
  /** По умолчанию только опубликованные; "all" — для админки */
  status?: FilmStatus | "all";
  /** Только эти фильмы (избранное) */
  ids?: readonly number[];
}

/** Страница результатов каталога */
export interface FilmPage {
  items: Film[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
