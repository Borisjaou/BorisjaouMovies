import { z } from "zod";
import {
  castText,
  durationText,
  fitDescription,
  getJson,
  IMPORT_MESSAGES,
  ImportError,
  mapGenres,
  originalText,
  yearText,
  type FetchFn,
  type ImportedFilm,
} from "./common";

/** TMDB API v3: https://developer.themoviedb.org (ключ API или токен доступа на чтение) */
const API = "https://api.themoviedb.org/3";
const IMAGES = "https://image.tmdb.org/t/p/w780";

const named = z.object({ name: z.string() });

const detailsSchema = z.object({
  title: z.string().nullish(),
  name: z.string().nullish(),
  original_title: z.string().nullish(),
  original_name: z.string().nullish(),
  release_date: z.string().nullish(),
  first_air_date: z.string().nullish(),
  runtime: z.number().nullish(),
  episode_run_time: z.array(z.number()).nullish(),
  overview: z.string().nullish(),
  poster_path: z.string().nullish(),
  genres: z.array(named).nullish(),
  production_countries: z.array(z.object({ iso_3166_1: z.string() })).nullish(),
  origin_country: z.array(z.string()).nullish(),
  created_by: z.array(named).nullish(),
  credits: z
    .object({
      cast: z.array(z.object({ name: z.string(), order: z.number().nullish() })).nullish(),
      crew: z.array(z.object({ name: z.string(), job: z.string().nullish() })).nullish(),
    })
    .nullish(),
  videos: z
    .object({
      results: z
        .array(z.object({ key: z.string(), site: z.string(), type: z.string(), iso_639_1: z.string().nullish() }))
        .nullish(),
    })
    .nullish(),
});

const findSchema = z.object({
  movie_results: z.array(z.object({ id: z.number() })).nullish(),
  tv_results: z.array(z.object({ id: z.number() })).nullish(),
});

/** Токен доступа (eyJ…) — в заголовке, короткий ключ API — параметром */
function auth(apiKey: string): { headers: Record<string, string>; query: string } {
  return apiKey.startsWith("eyJ")
    ? { headers: { Authorization: `Bearer ${apiKey}` }, query: "" }
    : { headers: {}, query: `&api_key=${encodeURIComponent(apiKey)}` };
}

/** Код страны → название по-русски («US» → «США», как в справочнике каталога) */
const COUNTRY_NAMES: Record<string, string> = { US: "США", RU: "Россия", SU: "СССР", GB: "Великобритания", KR: "Южная Корея" };
export function countryName(code: string | undefined): string {
  if (!code) return "";
  if (COUNTRY_NAMES[code]) return COUNTRY_NAMES[code];
  try {
    return new Intl.DisplayNames(["ru"], { type: "region" }).of(code) ?? "";
  } catch {
    return "";
  }
}

/** IMDb tt… → id и тип в TMDB */
export async function findByImdb(
  imdbId: string,
  apiKey: string,
  fetchFn: FetchFn,
): Promise<{ kind: "movie" | "tv"; id: string }> {
  const a = auth(apiKey);
  const found = findSchema.safeParse(
    await getJson(fetchFn, `${API}/find/${imdbId}?external_source=imdb_id${a.query}`, a.headers, "tmdb"),
  ).data;
  const movie = found?.movie_results?.[0];
  if (movie) return { kind: "movie", id: String(movie.id) };
  const tv = found?.tv_results?.[0];
  if (tv) return { kind: "tv", id: String(tv.id) };
  throw new ImportError(IMPORT_MESSAGES.notFound);
}

export async function importFromTmdb(
  kind: "movie" | "tv",
  id: string,
  apiKey: string,
  fetchFn: FetchFn,
): Promise<ImportedFilm> {
  const a = auth(apiKey);
  const url =
    `${API}/${kind}/${id}?language=ru-RU&append_to_response=credits,videos&include_video_language=ru,en${a.query}`;
  const parsed = detailsSchema.safeParse(await getJson(fetchFn, url, a.headers, "tmdb"));
  if (!parsed.success) throw new ImportError(IMPORT_MESSAGES.failed);
  const d = parsed.data;

  const title = (d.title || d.name || d.original_title || d.original_name || "").trim();
  const directors =
    kind === "movie"
      ? (d.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name)
      : (d.created_by ?? []).map((c) => c.name);
  const cast = [...(d.credits?.cast ?? [])].sort((x, y) => (x.order ?? 0) - (y.order ?? 0)).map((c) => c.name);
  const videos = (d.videos?.results ?? []).filter((v) => v.site === "YouTube");
  // Сначала русский трейлер, затем любой трейлер, затем любое видео
  const video =
    videos.find((v) => v.type === "Trailer" && v.iso_639_1 === "ru") ??
    videos.find((v) => v.type === "Trailer") ??
    videos[0];

  return {
    title: title.slice(0, 120),
    originalTitle: originalText(title, d.original_title || d.original_name),
    year: yearText(d.release_date || d.first_air_date),
    durationMin: durationText(d.runtime ?? d.episode_run_time?.[0]),
    genres: mapGenres((d.genres ?? []).map((g) => g.name)),
    country: countryName(d.production_countries?.[0]?.iso_3166_1 ?? d.origin_country?.[0]).slice(0, 60),
    director: [...new Set(directors)].slice(0, 2).join(", ").slice(0, 120),
    cast: castText(cast),
    description: fitDescription(d.overview),
    trailerUrl: video ? `https://www.youtube.com/watch?v=${video.key}` : "",
    posterUrl: d.poster_path ? `${IMAGES}${d.poster_path}` : null,
    source: "tmdb",
  };
}
