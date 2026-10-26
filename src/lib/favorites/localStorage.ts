import type { FavoriteEntry, FavoritesStorage } from "./types";

export const FAVORITES_KEY = "borisjaou:favorites";

function isEntry(value: unknown): value is FavoriteEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return Number.isInteger(v.filmId) && typeof v.addedAt === "number";
}

/**
 * Разбор сохранённого значения.
 * Поддерживает старый формат шага 4 — массив id: порядок в массиве = порядок добавления.
 */
export function parseEntries(raw: string | null): FavoriteEntry[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];

  const seen = new Set<number>();
  const out: FavoriteEntry[] = [];
  value.forEach((item: unknown, index) => {
    const entry: FavoriteEntry | null = isEntry(item)
      ? { filmId: item.filmId, addedAt: item.addedAt }
      : Number.isInteger(item)
        ? { filmId: item as number, addedAt: index }
        : null;
    if (entry && !seen.has(entry.filmId)) {
      seen.add(entry.filmId);
      out.push(entry);
    }
  });
  return out;
}

export function createLocalFavoritesStorage(key = FAVORITES_KEY): FavoritesStorage {
  const read = (): FavoriteEntry[] => {
    try {
      return parseEntries(window.localStorage.getItem(key));
    } catch {
      return [];
    }
  };
  const write = (entries: FavoriteEntry[]) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(entries));
    } catch {
      // хранилище недоступно (приватный режим) — избранное живёт до перезагрузки
    }
  };

  return {
    async load() {
      return read();
    },
    async add(entry) {
      write([...read().filter((e) => e.filmId !== entry.filmId), entry]);
    },
    async remove(filmId) {
      write(read().filter((e) => e.filmId !== filmId));
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
        if (e.key === key) onChange(parseEntries(e.newValue));
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
  };
}
