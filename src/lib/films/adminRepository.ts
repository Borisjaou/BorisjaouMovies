import type { PrismaClient } from "@/generated/prisma/client";
import type { FilmInput } from "./filmForm";
import { FILM_INCLUDE, filmSearchText, toFilm } from "./mapper";
import type { Film, FilmStatus, PosterColor, PosterShape, Verdict } from "./types";

/** Цвет и фигура постера для нового фильма — стабильно по slug (одинаково при каждом показе) */
export function posterLookFor(slug: string): { posterColor: PosterColor; posterShape: PosterShape } {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const colors: PosterColor[] = [1, 2, 3, 4, 5, 6];
  const shapes: PosterShape[] = [0, 1, 2];
  return { posterColor: colors[hash % 6], posterShape: shapes[Math.floor(hash / 6) % 3] };
}

/** Похожий фильм, найденный при сохранении */
export interface DuplicateFilm {
  id: number;
  slug: string;
  title: string;
  year: number;
  status: FilmStatus;
  /** source — тот же фильм с Кинопоиска / TMDB; title — совпало название */
  reason: "source" | "title";
}

/** Ключ названия для сравнения: без регистра, «ё», знаков и года в скобках в конце — «Матрица (1999)» = «матрица» */
export function titleKey(title: string | null | undefined): string | null {
  const key = (title ?? "")
    .replace(/\s*\(\s*\d{4}\s*\)\s*$/, "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  return key || null;
}

export interface SaveFilmOptions {
  status: FilmStatus;
  slug: string;
  /** undefined — постер не меняется, null — убрать */
  posterUrl?: string | null;
}

export function createAdminFilmsRepository(db: PrismaClient) {
  /** Все фильмы для списка админки: сначала новые по году (как в AdminFilms). Вкладки и поиск — на клиенте, как в эталоне. */
  async function listAll(): Promise<Film[]> {
    const rows = await db.film.findMany({
      orderBy: [{ year: "desc" }, { id: "asc" }],
      include: FILM_INCLUDE,
    });
    return rows.map(toFilm);
  }

  async function getById(id: number): Promise<Film | null> {
    const row = await db.film.findUnique({ where: { id }, include: FILM_INCLUDE });
    return row ? toFilm(row) : null;
  }

  async function isSlugTaken(slug: string, exceptId?: number): Promise<boolean> {
    const found = await db.film.findUnique({ where: { slug }, select: { id: true } });
    return Boolean(found && found.id !== exceptId);
  }

  function fields(input: FilmInput) {
    return {
      title: input.title,
      originalTitle: input.originalTitle,
      year: input.year,
      durationMin: input.durationMin,
      country: input.country,
      director: input.director,
      cast: input.cast.join("\n"),
      description: input.description,
      trailerUrl: input.trailerUrl,
      isNew: input.isNew,
      externalId: input.externalId,
      searchText: filmSearchText({ ...input, originalTitle: input.originalTitle ?? undefined }),
    };
  }

  const genreRows = (input: FilmInput) => input.genres.map((genre, position) => ({ genre, position }));

  async function create(input: FilmInput, options: SaveFilmOptions): Promise<Film> {
    const row = await db.film.create({
      data: {
        ...fields(input),
        slug: options.slug,
        status: options.status,
        // В форме одно поле описания: оно же идёт в карточки
        shortDescription: input.description,
        posterUrl: options.posterUrl ?? null,
        ...posterLookFor(options.slug),
        genres: { create: genreRows(input) },
      },
      include: FILM_INCLUDE,
    });
    return toFilm(row);
  }

  async function update(id: number, input: FilmInput, options: SaveFilmOptions): Promise<Film> {
    const current = await db.film.findUniqueOrThrow({ where: { id }, select: { description: true } });
    const row = await db.film.update({
      where: { id },
      data: {
        ...fields(input),
        status: options.status,
        // Короткое описание карточек меняется, только если поменяли описание
        ...(current.description !== input.description ? { shortDescription: input.description } : {}),
        ...(options.posterUrl !== undefined ? { posterUrl: options.posterUrl } : {}),
        genres: { deleteMany: {}, create: genreRows(input) },
      },
      include: FILM_INCLUDE,
    });
    return toFilm(row);
  }

  /**
   * Похожие фильмы: тот же источник автозаполнения или совпадение названия / оригинального названия
   * (в любую сторону). exceptId — сам фильм при редактировании.
   */
  async function findDuplicates(
    input: Pick<FilmInput, "title" | "originalTitle" | "externalId">,
    exceptId?: number,
  ): Promise<DuplicateFilm[]> {
    const keys = new Set([titleKey(input.title), titleKey(input.originalTitle)].filter((k): k is string => k !== null));
    const rows = await db.film.findMany({
      where: exceptId ? { id: { not: exceptId } } : {},
      select: { id: true, slug: true, title: true, originalTitle: true, year: true, status: true, externalId: true },
      orderBy: { id: "asc" },
    });
    const out: DuplicateFilm[] = [];
    for (const r of rows) {
      const sameSource = Boolean(input.externalId && r.externalId === input.externalId);
      const sameTitle = [titleKey(r.title), titleKey(r.originalTitle)].some((k) => k !== null && keys.has(k));
      if (!sameSource && !sameTitle) continue;
      out.push({
        id: r.id,
        slug: r.slug,
        title: r.title,
        year: r.year,
        status: r.status === "published" ? "published" : "draft",
        reason: sameSource ? "source" : "title",
      });
    }
    // Сначала точные совпадения по источнику
    return out.sort((a, b) => (a.reason === b.reason ? 0 : a.reason === "source" ? -1 : 1)).slice(0, 5);
  }

  /** Свободная ссылка: «dyuna», занято — «dyuna-2021», дальше «dyuna-2021-2»… */
  async function uniqueSlug(base: string, year: number): Promise<string> {
    if (!(await isSlugTaken(base))) return base;
    const withYear = base.endsWith(`-${year}`) ? base : `${base}-${year}`;
    if (!(await isSlugTaken(withYear))) return withYear;
    for (let n = 2; ; n++) {
      const candidate = `${withYear}-${n}`;
      if (!(await isSlugTaken(candidate))) return candidate;
    }
  }

  /** ИМХО автора: оценка и комментарий. Пустое ИМХО — без даты */
  async function setImho(id: number, value: { verdict: Verdict | null; imho: string }): Promise<Film> {
    const empty = value.verdict === null && value.imho === "";
    const row = await db.film.update({
      where: { id },
      data: { verdict: value.verdict, imho: value.imho, imhoAt: empty ? null : new Date() },
      include: FILM_INCLUDE,
    });
    return toFilm(row);
  }

  return { listAll, getById, isSlugTaken, findDuplicates, uniqueSlug, create, update, setImho };
}

export type AdminFilmsRepository = ReturnType<typeof createAdminFilmsRepository>;
