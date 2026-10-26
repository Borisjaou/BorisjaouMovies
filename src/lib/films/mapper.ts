import type { Prisma } from "@/generated/prisma/client";
import { AGE_RATINGS, GENRES } from "./constants";
import type { Film, FilmStatus, PosterColor, PosterShape } from "./types";

export const FILM_INCLUDE = {
  genres: { orderBy: { position: "asc" } },
} as const satisfies Prisma.FilmInclude;

export type FilmRow = Prisma.FilmGetPayload<{ include: typeof FILM_INCLUDE }>;

const POSTER_COLORS: readonly PosterColor[] = [1, 2, 3, 4, 5, 6];
const POSTER_SHAPES: readonly PosterShape[] = [0, 1, 2];

/** Строка базы → доменный Film (строки проверяются по справочникам) */
export function toFilm(row: FilmRow): Film {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    originalTitle: row.originalTitle ?? undefined,
    year: row.year,
    genres: row.genres.flatMap((g) => GENRES.filter((x) => x === g.genre)),
    rating: row.rating,
    durationMin: row.durationMin,
    ageRating: AGE_RATINGS.find((a) => a === row.ageRating) ?? null,
    country: row.country,
    director: row.director,
    cast: row.cast ? row.cast.split("\n").filter(Boolean) : [],
    shortDescription: row.shortDescription,
    description: row.description,
    posterColor: POSTER_COLORS.find((c) => c === row.posterColor) ?? 1,
    posterShape: POSTER_SHAPES.find((s) => s === row.posterShape) ?? 0,
    posterUrl: row.posterUrl ?? undefined,
    trailerUrl: row.trailerUrl ?? undefined,
    isNew: row.isNew,
    status: (row.status === "published" ? "published" : "draft") satisfies FilmStatus,
    popularity: row.popularity,
  };
}

/** Текст для поиска: название, оригинальное название, режиссёр, актёры — в нижнем регистре */
export function filmSearchText(film: Pick<Film, "title" | "originalTitle" | "director" | "cast">): string {
  return [film.title, film.originalTitle ?? "", film.director ?? "", ...film.cast].join("\n").toLowerCase();
}

/** Доменный Film → данные для записи (без id и жанров) */
export function toFilmData(film: Omit<Film, "id">): Omit<Prisma.FilmCreateInput, "genres" | "favorites"> {
  return {
    slug: film.slug,
    title: film.title,
    originalTitle: film.originalTitle ?? null,
    year: film.year,
    rating: film.rating,
    durationMin: film.durationMin,
    ageRating: film.ageRating,
    country: film.country,
    director: film.director,
    cast: film.cast.join("\n"),
    shortDescription: film.shortDescription,
    description: film.description,
    posterColor: film.posterColor,
    posterShape: film.posterShape,
    posterUrl: film.posterUrl ?? null,
    trailerUrl: film.trailerUrl ?? null,
    isNew: film.isNew,
    status: film.status,
    popularity: film.popularity,
    searchText: filmSearchText(film),
  };
}
