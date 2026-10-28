import { GENRES, type Genre } from "../constants";
import { DESCRIPTION_MAX, YEAR_MAX, YEAR_MIN } from "../filmForm";

/** Данные фильма из внешнего источника — уже в виде полей формы админки */
export interface ImportedFilm {
  title: string;
  originalTitle: string;
  year: string;
  durationMin: string;
  genres: Genre[];
  country: string;
  director: string;
  /** Через запятую, как в поле формы */
  cast: string;
  description: string;
  trailerUrl: string;
  /** Адрес картинки постера у источника (скачивается отдельно) */
  posterUrl: string | null;
  source: "kinopoisk" | "tmdb";
}

export type FetchFn = (input: string, init?: { headers?: Record<string, string> }) => Promise<Response>;

/** Ошибка импорта с текстом для админа */
export class ImportError extends Error {}

export const IMPORT_MESSAGES = {
  badLink: "Ссылка не распознана. Нужна страница фильма на Кинопоиске, TMDB или IMDb",
  noKinopoiskKey: "Не задан ключ Кинопоиска (KINOPOISK_API_KEY в настройках Vercel)",
  noTmdbKey: "Не задан ключ TMDB (TMDB_API_KEY в настройках Vercel)",
  notFound: "Фильм не найден у источника",
  badKey: "Источник не принял ключ API — проверьте его в настройках Vercel",
  limit: "Превышен лимит запросов к источнику — попробуйте позже",
  failed: "Не удалось получить данные. Попробуйте ещё раз",
} as const;

/** Сколько актёров переносить в поле «В ролях» */
export const CAST_LIMIT = 6;
const CAST_MAX_CHARS = 500;

/** Жанры источника (по-русски) → жанры каталога. Неизвестные пропускаются. */
const GENRE_RULES: ReadonlyArray<{ test: (g: string) => boolean; genre: Genre }> = [
  { test: (g) => g === "драма", genre: "Драма" },
  { test: (g) => g.startsWith("комеди"), genre: "Комедия" },
  { test: (g) => g.startsWith("триллер"), genre: "Триллер" },
  { test: (g) => g.includes("фантаст") || g.includes("фэнтези") || g.includes("нф"), genre: "Фантастика" },
  { test: (g) => g.includes("мульт") || g.includes("аниме") || g.includes("анимац"), genre: "Анимация" },
  { test: (g) => g.includes("приключ"), genre: "Приключения" },
  { test: (g) => g.startsWith("ужас"), genre: "Ужасы" },
  { test: (g) => g.startsWith("документ"), genre: "Документальное" },
  { test: (g) => g.startsWith("мелодрам"), genre: "Мелодрама" },
  { test: (g) => g.startsWith("детектив"), genre: "Детектив" },
  { test: (g) => g.startsWith("семей"), genre: "Семейное" },
  { test: (g) => g.startsWith("мюзикл"), genre: "Мюзикл" },
];

export function mapGenres(names: readonly string[]): Genre[] {
  const found = new Set<Genre>();
  for (const raw of names) {
    // «НФ и Фэнтези», «Боевик и Приключения» (TMDB, сериалы) — по частям
    for (const part of raw.toLowerCase().split(/\s+и\s+|,|&/)) {
      const g = part.trim();
      const rule = GENRE_RULES.find((r) => r.test(g));
      if (rule) found.add(rule.genre);
    }
  }
  // Порядок справочника, как при ручном выборе в форме
  return GENRES.filter((g) => found.has(g));
}

/** Описание не длиннее лимита формы: обрезается по концу предложения, если получится */
export function fitDescription(text: string | null | undefined, max = DESCRIPTION_MAX): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (end >= max * 0.5) return cut.slice(0, end + 1);
  return `${cut.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

export function castText(names: readonly string[]): string {
  const out: string[] = [];
  for (const name of names.map((n) => n.trim()).filter(Boolean)) {
    if (out.includes(name)) continue;
    if ([...out, name].join(", ").length > CAST_MAX_CHARS || out.length >= CAST_LIMIT) break;
    out.push(name);
  }
  return out.join(", ");
}

export function yearText(year: number | string | null | undefined): string {
  const n = typeof year === "string" ? Number(year.slice(0, 4)) : year;
  return n && Number.isInteger(n) && n >= YEAR_MIN && n <= YEAR_MAX ? String(n) : "";
}

export function durationText(minutes: number | null | undefined): string {
  return minutes && Number.isInteger(minutes) && minutes >= 1 && minutes <= 999 ? String(minutes) : "";
}

/** Название оригинала — только если отличается от русского */
export function originalText(title: string, original: string | null | undefined): string {
  const o = (original ?? "").trim();
  return o && o.toLowerCase() !== title.trim().toLowerCase() ? o.slice(0, 120) : "";
}

export function youtubeUrl(url: string | null | undefined): string {
  if (!url) return "";
  return /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//.test(url) ? url : "";
}

/** Ответ API → JSON; понятные ошибки на 401/403/404/429 */
export async function getJson(fetchFn: FetchFn, url: string, headers: Record<string, string>): Promise<unknown> {
  let res: Response;
  try {
    res = await fetchFn(url, { headers: { Accept: "application/json", ...headers } });
  } catch {
    throw new ImportError(IMPORT_MESSAGES.failed);
  }
  if (res.status === 401 || res.status === 403) throw new ImportError(IMPORT_MESSAGES.badKey);
  if (res.status === 404 || res.status === 400) throw new ImportError(IMPORT_MESSAGES.notFound);
  if (res.status === 402 || res.status === 429) throw new ImportError(IMPORT_MESSAGES.limit);
  if (!res.ok) throw new ImportError(IMPORT_MESSAGES.failed);
  return res.json();
}
