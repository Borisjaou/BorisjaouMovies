"use client";

import { useSession } from "next-auth/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createLocalWatchStorage } from "./localStorage";
import { createServerWatchStorage } from "./serverStorage";
import type { WatchEntry, WatchListApi, WatchListId, WatchStorage } from "./types";

interface WatchListsContextValue {
  ready: boolean;
  entries: readonly WatchEntry[];
  /** Добавить в список (из другого списка фильм переносится) */
  set(filmId: number, list: WatchListId): void;
  remove(filmId: number, list: WatchListId): void;
}

const WatchListsContext = createContext<WatchListsContextValue | null>(null);

/**
 * «Надо посмотреть» и «Просмотрено» — как избранное:
 * гость — localStorage, вошедший — база; при входе гостевые списки переносятся в аккаунт.
 * Фильм может быть только в одном из двух списков.
 */
export function WatchListsProvider({ children }: { children: ReactNode }) {
  const { status, data } = useSession();
  const userId = data?.user?.id ?? null;
  const [local] = useState(createLocalWatchStorage);
  const [server] = useState(createServerWatchStorage);
  const storageRef = useRef<WatchStorage>(local);
  const [entries, setEntries] = useState<WatchEntry[]>([]);
  const [ready, setReady] = useState(false);
  const entriesRef = useRef<WatchEntry[]>([]);

  const commit = useCallback((next: WatchEntry[]) => {
    entriesRef.current = next;
    setEntries(next);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    let alive = true;

    async function load(): Promise<void> {
      let loaded: WatchEntry[];
      if (status === "authenticated" && userId) {
        const guest = await local.load();
        try {
          loaded = guest.length ? await server.merge(guest) : await server.load();
          if (guest.length) await local.clear?.();
          storageRef.current = server;
        } catch {
          // сессия есть, а пользователя в базе нет — ведём себя как гость
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

  const set = useCallback(
    (filmId: number, list: WatchListId) => {
      const prev = entriesRef.current;
      if (prev.some((e) => e.filmId === filmId && e.list === list)) return;
      const entry: WatchEntry = { filmId, addedAt: Date.now(), list };
      commit([...prev.filter((e) => e.filmId !== filmId), entry]);
      storageRef.current.set(entry).catch(() => commit(prev));
    },
    [commit],
  );

  const remove = useCallback(
    (filmId: number, list: WatchListId) => {
      const prev = entriesRef.current;
      if (!prev.some((e) => e.filmId === filmId && e.list === list)) return;
      commit(prev.filter((e) => !(e.filmId === filmId && e.list === list)));
      storageRef.current.remove(filmId, list).catch(() => commit(prev));
    },
    [commit],
  );

  const value = useMemo<WatchListsContextValue>(() => ({ ready, entries, set, remove }), [ready, entries, set, remove]);
  return <WatchListsContext.Provider value={value}>{children}</WatchListsContext.Provider>;
}

/** Один список в том же виде, что и useFavorites() */
export function useWatchList(list: WatchListId): WatchListApi {
  const ctx = useContext(WatchListsContext);
  if (!ctx) throw new Error("useWatchList() нужно вызывать внутри <WatchListsProvider>");
  const { ready, entries, set, remove } = ctx;

  return useMemo<WatchListApi>(() => {
    const own = entries.filter((e) => e.list === list).map(({ filmId, addedAt }) => ({ filmId, addedAt }));
    const ids = new Set(own.map((e) => e.filmId));
    return {
      ready,
      entries: own,
      count: ids.size,
      has: (id) => ids.has(id),
      add: (id) => set(id, list),
      remove: (id) => remove(id, list),
      toggle: (id) => {
        const on = ids.has(id);
        if (on) remove(id, list);
        else set(id, list);
        return !on;
      },
    };
  }, [ready, entries, set, remove, list]);
}
