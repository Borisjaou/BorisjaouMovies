import type { Film } from "@/lib/films/types";
import type { FavoriteEntry } from "./types";

/** Сортировка избранного (Favorites.dc.html): Недавние / Год (рейтинг убран с сайта) */
export const FAVORITE_SORTS = [
  { id: "recent", label: "Недавние" },
  { id: "year", label: "Год" },
] as const;
export type FavoriteSortId = (typeof FAVORITE_SORTS)[number]["id"];

/** Фильмы из избранного в нужном порядке; фильмы, которых уже нет в каталоге, пропускаются */
export function favoriteFilms(
  films: readonly Film[],
  entries: readonly FavoriteEntry[],
  sort: FavoriteSortId,
): Film[] {
  const byId = new Map(films.map((f) => [f.id, f]));
  const rows = entries.flatMap((e) => {
    const film = byId.get(e.filmId);
    return film ? [{ film, addedAt: e.addedAt }] : [];
  });
  const key = (r: (typeof rows)[number]): number =>
    sort === "recent" ? r.addedAt : r.film.year;
  return rows
    .map((r, index) => ({ r, index }))
    .sort((a, b) => key(b.r) - key(a.r) || a.index - b.index)
    .map(({ r }) => r.film);
}
