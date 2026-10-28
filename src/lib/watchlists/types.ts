import type { FavoriteEntry, FavoritesApi } from "@/lib/favorites/types";

/** Списки зрителя рядом с «Избранным» */
export const WATCH_LISTS = ["watchlist", "watched"] as const;
export type WatchListId = (typeof WATCH_LISTS)[number];

export function isWatchListId(value: unknown): value is WatchListId {
  return WATCH_LISTS.some((id) => id === value);
}

/** Запись списка: фильм может быть только в одном из списков */
export interface WatchEntry extends FavoriteEntry {
  list: WatchListId;
}

/** Хранилище обоих списков (localStorage у гостя, база у вошедшего) */
export interface WatchStorage {
  load(): Promise<WatchEntry[]>;
  /** Добавить в список; если фильм был в другом списке — переносится */
  set(entry: WatchEntry): Promise<void>;
  /** Убрать фильм из списка (если он именно в этом списке) */
  remove(filmId: number, list: WatchListId): Promise<void>;
  clear?(): Promise<void>;
  subscribe?(onChange: (entries: WatchEntry[]) => void): () => void;
}

/** Один список для компонентов — тот же интерфейс, что у избранного */
export type WatchListApi = FavoritesApi;
