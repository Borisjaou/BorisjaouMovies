import type { Film } from "./types";

/** 128 → «2 ч 08 мин» (Movie.dc.html); меньше часа → «45 мин» */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} ч ${String(m).padStart(2, "0")} мин` : `${m} мин`;
}

/** «2024 · Фантастика» — окно «Поделиться» и «Похожие фильмы» */
export function filmMeta(film: Film): string {
  return [String(film.year), film.genres[0]].filter(Boolean).join(" · ");
}
