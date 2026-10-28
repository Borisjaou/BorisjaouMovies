/**
 * Публичный вход избранного: import { useFavorites } from "@/lib/favorites".
 * Реализация — в папке ./favorites.
 */
export { FavoritesProvider, useFavorites } from "./favorites/context";
export { useFavoriteFilms, useListFilms } from "./favorites/useFavoriteFilms";
export { FAVORITE_SORTS, favoriteFilms, type FavoriteSortId } from "./favorites/sort";
export type { FavoriteEntry, FavoritesApi, FavoritesStorage } from "./favorites/types";
