"use client";

import { useEffect, useMemo, useState } from "react";
import { favoriteFilmsAction } from "@/app/actions/films";
import type { Film } from "@/lib/films/types";
import { useFavorites } from "./context";
import type { FavoritesApi } from "./types";

/**
 * Фильмы списка (избранное, «Надо посмотреть», «Просмотрено») — данные с сервера,
 * с фильмами и сортировкой каталога из `search`.
 * null — ещё загружается. При удалении из списка фильм пропадает сразу, не дожидаясь ответа.
 */
export function useListFilms(list: Pick<FavoritesApi, "ready" | "entries">, search: string, enabled = true): Film[] | null {
  const { ready, entries } = list;
  const idsKey = useMemo(
    () =>
      entries
        .map((e) => e.filmId)
        .sort((a, b) => a - b)
        .join(","),
    [entries],
  );
  const key = `${idsKey}|${search}`;
  const [state, setState] = useState<{ key: string; films: Film[] } | null>(null);

  useEffect(() => {
    if (!enabled || !ready) return;
    let alive = true;
    const ids = idsKey ? idsKey.split(",").map(Number) : [];
    favoriteFilmsAction(ids, search)
      .then((films) => alive && setState({ key, films }))
      .catch(() => alive && setState({ key, films: [] }));
    return () => {
      alive = false;
    };
  }, [enabled, ready, key, idsKey, search]);

  return useMemo(() => {
    if (!enabled || !ready || !state) return null;
    if (state.key === key) return state.films;
    const ids = new Set(entries.map((e) => e.filmId));
    return state.films.filter((f) => ids.has(f.id));
  }, [enabled, ready, state, key, entries]);
}

/** Фильмы из избранного */
export function useFavoriteFilms(search: string, enabled = true): Film[] | null {
  return useListFilms(useFavorites(), search, enabled);
}
