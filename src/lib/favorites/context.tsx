"use client";

import { useSession } from "next-auth/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createLocalFavoritesStorage } from "./localStorage";
import { createServerFavoritesStorage } from "./serverStorage";
import type { FavoriteEntry, FavoritesApi, FavoritesStorage } from "./types";

const FavoritesContext = createContext<FavoritesApi | null>(null);

/**
 * Где хранится избранное:
 * - гость — localStorage (синхронизация между вкладками);
 * - вошедший пользователь — база через серверные действия.
 * При входе гостевой список переносится в аккаунт, а localStorage очищается.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { status, data } = useSession();
  const userId = data?.user?.id ?? null;

  const [local] = useState(createLocalFavoritesStorage);
  const [server] = useState(createServerFavoritesStorage);
  const storageRef = useRef<FavoritesStorage>(local);

  const [entries, setEntries] = useState<FavoriteEntry[]>([]);
  const [ready, setReady] = useState(false);
  const entriesRef = useRef<FavoriteEntry[]>([]);

  const commit = useCallback((next: FavoriteEntry[]) => {
    entriesRef.current = next;
    setEntries(next);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    let alive = true;

    async function load(): Promise<void> {
      let loaded: FavoriteEntry[];
      if (status === "authenticated" && userId) {
        const guest = await local.load();
        try {
          loaded = guest.length ? await server.merge(guest) : await server.load();
          if (guest.length) await local.clear?.();
          storageRef.current = server;
        } catch {
          // сессия есть, а пользователя в базе нет (например, база пересоздана) — ведём себя как гость
          loaded = guest;
          storageRef.current = local;
        }
      } else {
        loaded = await local.load();
        storageRef.current = local;
      }
      if (!alive) return;
      commit(loaded);
      setReady(true);
    }

    void load();
    const unsubscribe = status === "unauthenticated" ? local.subscribe?.(commit) : undefined;
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [status, userId, local, server, commit]);

  const add = useCallback(
    (filmId: number) => {
      const prev = entriesRef.current;
      if (prev.some((e) => e.filmId === filmId)) return;
      const entry = { filmId, addedAt: Date.now() };
      commit([...prev, entry]);
      storageRef.current.add(entry).catch(() => commit(prev));
    },
    [commit],
  );

  const remove = useCallback(
    (filmId: number) => {
      const prev = entriesRef.current;
      if (!prev.some((e) => e.filmId === filmId)) return;
      commit(prev.filter((e) => e.filmId !== filmId));
      storageRef.current.remove(filmId).catch(() => commit(prev));
    },
    [commit],
  );

  const toggle = useCallback(
    (filmId: number) => {
      const on = entriesRef.current.some((e) => e.filmId === filmId);
      if (on) remove(filmId);
      else add(filmId);
      return !on;
    },
    [add, remove],
  );

  const api = useMemo<FavoritesApi>(() => {
    const ids = new Set(entries.map((e) => e.filmId));
    return { ready, entries, count: ids.size, has: (id) => ids.has(id), add, remove, toggle };
  }, [ready, entries, add, remove, toggle]);

  return <FavoritesContext.Provider value={api}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesApi {
  const api = useContext(FavoritesContext);
  if (!api) throw new Error("useFavorites() нужно вызывать внутри <FavoritesProvider>");
  return api;
}
