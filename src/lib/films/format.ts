import type { Film } from "./types";

/** 128 → «2 ч 08 мин» (Movie.dc.html); меньше часа → «45 мин» */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} ч ${String(m).padStart(2, "0")} мин` : `${m} мин`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/** «2024 · Фантастика · 8.4» — окно «Поделиться» и «Похожие фильмы» */
export function filmMeta(film: Film): string {
  const parts = [String(film.year), film.genres[0]];
  if (film.rating !== null) parts.push(formatRating(film.rating));
  return parts.join(" · ");
}
