import {
  listWatchListsAction,
  mergeWatchListsAction,
  removeFromWatchListAction,
  setWatchListAction,
} from "@/app/actions/watchlists";
import type { WatchEntry, WatchStorage } from "./types";

/** Списки вошедшего пользователя — в базе через серверные действия */
export function createServerWatchStorage(): WatchStorage & { merge(entries: WatchEntry[]): Promise<WatchEntry[]> } {
  return {
    load: () => listWatchListsAction(),
    set: (entry) => setWatchListAction(entry.filmId, entry.list),
    remove: (filmId, list) => removeFromWatchListAction(filmId, list),
    merge: (entries) => mergeWatchListsAction(entries),
  };
}
