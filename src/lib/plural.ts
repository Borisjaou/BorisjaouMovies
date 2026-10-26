/** Склонение по числу (формула из эталона: plural / word) */
export function plural(n: number, forms: readonly [one: string, few: string, many: string]): string {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return forms[0];
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return forms[1];
  return forms[2];
}

export const FILM_FORMS = ["фильм", "фильма", "фильмов"] as const;
export const FILTER_FORMS = ["фильтр", "фильтра", "фильтров"] as const;
export const GENRE_FORMS = ["жанр", "жанра", "жанров"] as const;
