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

  return { listAll, getById, isSlugTaken, create, update, setImho };
}

export type AdminFilmsRepository = ReturnType<typeof createAdminFilmsRepository>;
