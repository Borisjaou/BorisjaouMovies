"use client";

import { useFavorites, type FavoritesApi } from "@/lib/favorites";
import type { ShelfId } from "@/lib/shelves";
import { useWatchList } from "@/lib/watchlists";

/** Список раздела в едином виде: избранное или «Надо посмотреть» / «Просмотрено» */
export function useShelf(shelf: ShelfId): FavoritesApi {
  const favorites = useFavorites();
  const watchlist = useWatchList("watchlist");
  const watched = useWatchList("watched");
  return shelf === "favorites" ? favorites : shelf === "watchlist" ? watchlist : watched;
}

/** Все три списка сразу (меню с бейджами, кнопки на карточке) */
export function useShelves(): Record<ShelfId, FavoritesApi> {
  return { favorites: useFavorites(), watchlist: useWatchList("watchlist"), watched: useWatchList("watched") };
}
