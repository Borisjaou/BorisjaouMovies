"use client";

import { useEffect, useMemo, useState } from "react";
import { unwatchedFilmsAction } from "@/app/actions/films";
import type { FavoritesApi } from "@/lib/favorites";
import type { Film } from "@/lib/films/types";

/**
 * «Не смотрел»: фильмы каталога (с фильтрами из `search`) без отмеченных «Просмотрено».
 * null — ещё загружается. Отмеченный только что фильм пропадает сразу, не дожидаясь ответа.
 */
export function useUnwatchedFilms(watched: Pick<FavoritesApi, "ready" | "entries">, search: string, enabled: boolean) {
  const { ready, entries } = watched;
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
    unwatchedFilmsAction(ids, search)
      .then((films) => alive && setState({ key, films }))
      .catch(() => alive && setState({ key, films: [] }));
    return () => {
      alive = false;
    };
  }, [enabled, ready, key, idsKey, search]);

  return useMemo(() => {
    if (!enabled || !ready || !state) return null;
    // Пока идёт новый запрос — показываем прежний список без только что просмотренных
    if (state.key.split("|").slice(1).join("|") !== search) return null;
    const seen = new Set(entries.map((e) => e.filmId));
    return state.films.filter((f) => !seen.has(f.id));
  }, [enabled, ready, state, search, entries]);
}
