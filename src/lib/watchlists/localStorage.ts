import { isWatchListId, type WatchEntry, type WatchStorage } from "./types";

export const WATCH_LISTS_KEY = "borisjaou:watchlists";

function isEntry(value: unknown): value is WatchEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return Number.isInteger(v.filmId) && typeof v.addedAt === "number" && isWatchListId(v.list);
}

/** Разбор сохранённого значения: мусор и повторы фильма отбрасываются (остаётся последняя запись) */
export function parseWatchEntries(raw: string | null): WatchEntry[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  const byFilm = new Map<number, WatchEntry>();
  for (const item of value) {
    if (!isEntry(item)) continue;
    byFilm.delete(item.filmId);
    byFilm.set(item.filmId, { filmId: item.filmId, addedAt: item.addedAt, list: item.list });
  }
  return [...byFilm.values()];
}

export function createLocalWatchStorage(key = WATCH_LISTS_KEY): WatchStorage {
  const read = (): WatchEntry[] => {
    try {
      return parseWatchEntries(window.localStorage.getItem(key));
    } catch {
      return [];
    }
  };
  const write = (entries: WatchEntry[]) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(entries));
    } catch {
      // хранилище недоступно (приватный режим) — списки живут до перезагрузки
    }
  };

  return {
    async load() {
      return read();
    },
    async set(entry) {
      write([...read().filter((e) => e.filmId !== entry.filmId), entry]);
    },
    async remove(filmId, list) {
      write(read().filter((e) => !(e.filmId === filmId && e.list === list)));
    },
    async clear() {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // хранилище недоступно
      }
    },
    subscribe(onChange) {
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) onChange(parseWatchEntries(e.newValue));
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
  };
}
