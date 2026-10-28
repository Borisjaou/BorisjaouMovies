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
  youtubeUrl,
  type FetchFn,
  type ImportedFilm,
} from "./common";

/** Неофициальный API Кинопоиска: https://kinopoiskapiunofficial.tech (ключ — в личном кабинете) */
const API = "https://kinopoiskapiunofficial.tech";

const filmSchema = z.object({
  nameRu: z.string().nullish(),
  nameEn: z.string().nullish(),
  nameOriginal: z.string().nullish(),
  year: z.number().nullish(),
  filmLength: z.number().nullish(),
  description: z.string().nullish(),
  shortDescription: z.string().nullish(),
  posterUrl: z.string().nullish(),
  countries: z.array(z.object({ country: z.string() })).nullish(),
  genres: z.array(z.object({ genre: z.string() })).nullish(),
});

const staffSchema = z.array(
  z.object({
    nameRu: z.string().nullish(),
    nameEn: z.string().nullish(),
    professionKey: z.string().nullish(),
  }),
);

const videosSchema = z.object({
  items: z.array(z.object({ url: z.string().nullish(), name: z.string().nullish(), site: z.string().nullish() })).nullish(),
});

export async function importFromKinopoisk(id: string, apiKey: string, fetchFn: FetchFn): Promise<ImportedFilm> {
  const headers = { "X-API-KEY": apiKey };
  const film = filmSchema.safeParse(await getJson(fetchFn, `${API}/api/v2.2/films/${id}`, headers, "kinopoisk"));
  if (!film.success) throw new ImportError(IMPORT_MESSAGES.failed);
  const f = film.data;

  // Съёмочная группа и трейлер не обязательны: без них форма всё равно заполнится
  const [staffRaw, videosRaw] = await Promise.all([
    getJson(fetchFn, `${API}/api/v1/staff?filmId=${id}`, headers, "kinopoisk").catch(() => []),
    getJson(fetchFn, `${API}/api/v2.2/films/${id}/videos`, headers, "kinopoisk").catch(() => ({ items: [] })),
  ]);
  const staff = staffSchema.safeParse(staffRaw).data ?? [];
  const videos = videosSchema.safeParse(videosRaw).data?.items ?? [];

  const name = (p: (typeof staff)[number]) => p.nameRu?.trim() || p.nameEn?.trim() || "";
  const title = (f.nameRu || f.nameOriginal || f.nameEn || "").trim();
  const trailer =
    videos.find((v) => v.site === "YOUTUBE" && /трейлер|trailer/i.test(v.name ?? "") && youtubeUrl(v.url)) ??
    videos.find((v) => v.site === "YOUTUBE" && youtubeUrl(v.url));

  return {
    title: title.slice(0, 120),
    originalTitle: originalText(title, f.nameOriginal || f.nameEn),
    year: yearText(f.year),
    durationMin: durationText(f.filmLength),
    genres: mapGenres((f.genres ?? []).map((g) => g.genre)),
    country: (f.countries?.[0]?.country ?? "").slice(0, 60),
    director: staff
      .filter((p) => p.professionKey === "DIRECTOR")
      .map(name)
      .filter(Boolean)
      .slice(0, 2)
      .join(", ")
      .slice(0, 120),
    cast: castText(staff.filter((p) => p.professionKey === "ACTOR").map(name)),
    description: fitDescription(f.description || f.shortDescription),
    trailerUrl: youtubeUrl(trailer?.url),
    posterUrl: f.posterUrl ?? null,
    source: "kinopoisk",
  };
}
