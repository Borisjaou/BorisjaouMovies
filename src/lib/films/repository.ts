import type { PrismaClient } from "@/generated/prisma/client";
import { FILM_INCLUDE, toFilm } from "./mapper";
import { buildFilmOrderBy, buildFilmWhere } from "./query";
import type { Film, FilmFilters, FilmPage } from "./types";

export const PAGE_SIZE = 20;
/** Верхняя граница выборки по id (избранное) */
export const MAX_IDS = 500;

export interface PageOptions {
  /** С 1 */
  page?: number;
  pageSize?: number;
}

/** Запросы к фильмам. Клиент передаётся снаружи — так их можно тестировать на временной базе. */
export function createFilmsRepository(db: PrismaClient) {
  async function getFilms(filters: FilmFilters = {}, options: PageOptions = {}): Promise<FilmPage> {
    const pageSize = Math.min(Math.max(options.pageSize ?? PAGE_SIZE, 1), MAX_IDS);
    const page = Math.max(Math.floor(options.page ?? 1), 1);
    const where = buildFilmWhere({ ...filters, ids: filters.ids?.slice(0, MAX_IDS) });

    const [rows, total] = await Promise.all([
      db.film.findMany({
        where,
        orderBy: buildFilmOrderBy(filters.sort),
        include: FILM_INCLUDE,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.film.count({ where }),
    ]);

    return { items: rows.map(toFilm), total, page, pageSize, hasMore: page * pageSize < total };
  }

  async function getFilmBySlug(slug: string, options: { includeDrafts?: boolean } = {}): Promise<Film | null> {
    const row = await db.film.findUnique({ where: { slug }, include: FILM_INCLUDE });
    if (!row) return null;
    if (row.status !== "published" && !options.includeDrafts) return null;
    return toFilm(row);
  }

  /**
   * «Похожие фильмы»: опубликованные, кроме самого фильма.
   * Сначала больше общих жанров, затем выше рейтинг, популярнее, раньше добавлен.
   */
  async function getSimilarFilms(film: Film, limit = 5): Promise<Film[]> {
    const base = { status: "published", id: { not: film.id } } as const;
    const byGenre = (
      await db.film.findMany({
        where: { ...base, genres: { some: { genre: { in: film.genres } } } },
        include: FILM_INCLUDE,
        take: 100,
      })
    )
      .map(toFilm)
      .map((f) => ({ f, shared: f.genres.filter((g) => film.genres.includes(g)).length }))
      .sort(
        (a, b) =>
          b.shared - a.shared ||
          (b.f.rating ?? -1) - (a.f.rating ?? -1) ||
          b.f.popularity - a.f.popularity ||
          a.f.id - b.f.id,
      )
      .map((x) => x.f)
      .slice(0, limit);

    if (byGenre.length >= limit) return byGenre;

    const rest = await db.film.findMany({
      where: { ...base, id: { notIn: [film.id, ...byGenre.map((f) => f.id)] } },
      orderBy: [{ rating: { sort: "desc", nulls: "last" } }, { popularity: "desc" }, { id: "asc" }],
      include: FILM_INCLUDE,
      take: limit - byGenre.length,
    });
    return [...byGenre, ...rest.map(toFilm)];
  }

  /** «Новинки»: опубликованные с isNew в порядке добавления; limit — 3 на ПК */
  async function getNewFilms(limit?: number): Promise<Film[]> {
    const rows = await db.film.findMany({
      where: { status: "published", isNew: true },
      orderBy: { id: "asc" },
      include: FILM_INCLUDE,
      take: limit,
    });
    return rows.map(toFilm);
  }

  /** Опубликованные фильмы для sitemap.xml: ссылка и дата последнего изменения */
  async function getPublishedSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
    return db.film.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
      orderBy: { id: "asc" },
    });
  }

  return { getFilms, getFilmBySlug, getSimilarFilms, getNewFilms, getPublishedSlugs };
}

export type FilmsRepository = ReturnType<typeof createFilmsRepository>;
