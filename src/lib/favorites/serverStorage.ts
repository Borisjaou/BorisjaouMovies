import {
  addFavoriteAction,
  listFavoritesAction,
  mergeFavoritesAction,
  removeFavoriteAction,
} from "@/app/actions/favorites";
import type { FavoriteEntry, FavoritesStorage } from "./types";

/** Избранное вошедшего пользователя — в базе через серверные действия */
export function createServerFavoritesStorage(): FavoritesStorage & {
  merge(entries: FavoriteEntry[]): Promise<FavoriteEntry[]>;
} {
  return {
    load: () => listFavoritesAction(),
    add: (entry) => addFavoriteAction(entry.filmId),
    remove: (filmId) => removeFavoriteAction(filmId),
    merge: (entries) => mergeFavoritesAction(entries),
  };
}
