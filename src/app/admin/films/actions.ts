"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { adminFilms } from "@/lib/films/admin";
import {
  checkFilmForm,
  FILM_FORM_MESSAGES,
  filmFormValuesFromFormData,
  type FilmFormField,
  type RequiredField,
} from "@/lib/films/filmForm";
import { importFilm, IMPORT_MESSAGES, ImportError, type ImportedFilm } from "@/lib/films/import";
import { slugify } from "@/lib/films/slugify";
import type { FilmStatus } from "@/lib/films/types";
import { detectImage, POSTER_ERROR, POSTER_MAX_BYTES, POSTER_TYPES } from "@/lib/storage/image";
import { getFileStorage } from "@/lib/storage";

export interface SavedFilm {
  id: number;
  slug: string;
  title: string;
  status: FilmStatus;
  isNew: boolean;
}

export type SaveFilmResult =
  | { ok: true; film: SavedFilm }
  | {
      ok: false;
      missing: RequiredField[];
      fieldErrors: Partial<Record<FilmFormField | "poster", string>>;
      formError?: string;
    };

const metaSchema = z.object({
  intent: z.enum(["draft", "publish"]),
  id: z.union([z.literal(""), z.coerce.number().int().positive()]),
});

const FORBIDDEN_TEXT = "Нет доступа: действие только для администратора";
const FAILED_TEXT = "Не удалось сохранить фильм. Попробуйте ещё раз";

function fail(fields: Partial<Omit<Extract<SaveFilmResult, { ok: false }>, "ok">>): SaveFilmResult {
  return { ok: false, missing: [], fieldErrors: {}, ...fields };
}

/** Постер из формы → байты проверенной картинки (JPG / PNG до 4 МБ) */
async function readPoster(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return { file: null };
  if (value.size > POSTER_MAX_BYTES) return { error: POSTER_ERROR };
  const data = new Uint8Array(await value.arrayBuffer());
  const kind = detectImage(data);
  if (!kind || !POSTER_TYPES.includes(kind.extension)) return { error: POSTER_ERROR };
  return { file: { data, ...kind } };
}

/** «В черновик» / «Опубликовать» в AdminAdd — создание и редактирование */
export async function saveFilmAction(formData: FormData): Promise<SaveFilmResult> {
  try {
    await requireAdmin();
  } catch {
    return fail({ formError: FORBIDDEN_TEXT });
  }

  const meta = metaSchema.safeParse({ intent: formData.get("intent"), id: formData.get("id") ?? "" });
  if (!meta.success) return fail({ formError: FAILED_TEXT });
  const id = meta.data.id === "" ? null : meta.data.id;
  const status: FilmStatus = meta.data.intent === "publish" ? "published" : "draft";

  // Та же проверка, что и на клиенте
  const check = checkFilmForm(filmFormValuesFromFormData(formData));
  const poster = await readPoster(formData.get("poster"));
  if (!check.data || "error" in poster) {
    return fail({
      missing: check.missing,
      fieldErrors: { ...check.fieldErrors, ...("error" in poster ? { poster: poster.error } : {}) },
    });
  }

  const existing = id === null ? null : await adminFilms.getById(id);
  if (id !== null && !existing) return fail({ formError: "Фильм не найден — возможно, его уже удалили" });

  // Ссылка /film/{slug}: у нового — из названия (как в эталоне), у существующего не меняется
  const slug = existing ? existing.slug : slugify(check.data.title);
  if (!existing && (await adminFilms.isSlugTaken(slug))) {
    return fail({ fieldErrors: { title: FILM_FORM_MESSAGES.slugTaken } });
  }

  const storage = getFileStorage();
  const stored = poster.file
    ? await storage.save({
        data: poster.file.data,
        contentType: poster.file.contentType,
        extension: poster.file.extension,
        folder: "posters",
      })
    : null;

  try {
    const film = existing
      ? await adminFilms.update(existing.id, check.data, { status, slug, posterUrl: stored?.url })
      : await adminFilms.create(check.data, { status, slug, posterUrl: stored?.url ?? null });

    // Старый постер больше не нужен
    if (stored && existing?.posterUrl) await storage.deleteByUrl(existing.posterUrl);

    revalidatePath("/", "layout");
    return { ok: true, film: { id: film.id, slug: film.slug, title: film.title, status: film.status, isNew: film.isNew } };
  } catch {
    if (stored) await storage.deleteByUrl(stored.url);
    return fail({ formError: FAILED_TEXT });
  }
}

// ---- Автозаполнение по ссылке (Кинопоиск / TMDB / IMDb) ----

export type ImportFilmResult =
  | {
      ok: true;
      values: Omit<ImportedFilm, "posterUrl" | "source">;
      source: ImportedFilm["source"];
      /** Постер в base64 — форма превращает его в файл, как при ручной загрузке */
      poster: { data: string; type: string; name: string } | null;
    }
  | { ok: false; error: string };

/** Откуда можно скачивать постер (адрес приходит от API, а не от пользователя) */
const POSTER_HOSTS = [/^kinopoiskapiunofficial\.tech$/, /\.mds\.yandex\.net$/, /^image\.tmdb\.org$/];

async function downloadPoster(url: string | null): Promise<{ data: string; type: string; name: string } | null> {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !POSTER_HOSTS.some((h) => h.test(u.hostname))) return null;
    const res = await fetch(u, { redirect: "follow" });
    if (!res.ok) return null;
    if (Number(res.headers.get("content-length") ?? 0) > POSTER_MAX_BYTES) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > POSTER_MAX_BYTES) return null;
    const kind = detectImage(bytes);
    if (!kind || !POSTER_TYPES.includes(kind.extension)) return null;
    return { data: Buffer.from(bytes).toString("base64"), type: kind.contentType, name: `poster.${kind.extension}` };
  } catch {
    return null;
  }
}

const linkSchema = z.string().trim().min(1).max(500);

export async function importFilmAction(link: string): Promise<ImportFilmResult> {
  await requireAdmin();
  const parsedLink = linkSchema.safeParse(link);
  if (!parsedLink.success) return { ok: false, error: IMPORT_MESSAGES.badLink };
  try {
    const film = await importFilm(parsedLink.data, {
      kinopoisk: process.env.KINOPOISK_API_KEY,
      tmdb: process.env.TMDB_API_KEY,
    });
    const { posterUrl, source, ...values } = film;
    return { ok: true, values, source, poster: await downloadPoster(posterUrl) };
  } catch (error) {
    if (error instanceof ImportError) return { ok: false, error: error.message };
    console.error("importFilmAction", error);
    return { ok: false, error: IMPORT_MESSAGES.failed };
  }
}
