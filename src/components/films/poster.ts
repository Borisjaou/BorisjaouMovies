import type { PosterColor } from "@/lib/films/types";

/** posters[i] из THEMES → CSS-переменная --poster-i (i = 0…5) */
export function posterVar(index: number): string {
  return `var(--poster-${((index % 6) + 6) % 6})`;
}

/** Цвет постера фильма: posterColor 1–6 → posters[0…5] */
export function filmPosterVar(color: PosterColor): string {
  return posterVar(color - 1);
}

/** «Новинки» в эталоне сдвинуты на два цвета: posters[(c + 2) % 6] */
export function freshPosterVar(color: PosterColor): string {
  return posterVar(color - 1 + 2);
}
