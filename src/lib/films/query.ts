import type { Prisma } from "@/generated/prisma/client";
import { DECADES, DURATION_OPTIONS, RATING_OPTIONS, type SortId } from "./constants";
import type { FilmFilters } from "./types";

/** Фильтры каталога → условие запроса. Внутри фильтра — «или», между фильтрами — «и». */
export function buildFilmWhere(filters: FilmFilters): Prisma.FilmWhereInput {
  const and: Prisma.FilmWhereInput[] = [];

  const status = filters.status ?? "published";
  if (status !== "all") and.push({ status });

  if (filters.ids) and.push({ id: { in: [...filters.ids] } });

  const q = filters.query?.trim().toLowerCase();
  if (q) and.push({ searchText: { contains: q } });

  if (filters.genres?.length) and.push({ genres: { some: { genre: { in: [...filters.genres] } } } });

  const decades = DECADES.filter((d) => filters.decades?.includes(d.id));
  if (decades.length) and.push({ OR: decades.map((d) => ({ year: { gte: d.from, lte: d.to } })) });

  if (filters.yearFrom !== undefined) and.push({ year: { gte: filters.yearFrom } });
  if (filters.yearTo !== undefined) and.push({ year: { lte: filters.yearTo } });

  const rating = RATING_OPTIONS.find((o) => o.id === filters.rating);
  if (rating && rating.min !== null) and.push({ rating: { gte: rating.min } });

  const duration = DURATION_OPTIONS.find((o) => o.id === filters.duration);
  if (duration) {
    and.push({
      durationMin: {
        not: null,
        ...(duration.min !== null ? { gte: duration.min } : {}),
        ...(duration.max !== null ? { lte: duration.max } : {}),
      },
    });
  }

  if (filters.ages?.length) and.push({ ageRating: { in: [...filters.ages] } });
  if (filters.country) and.push({ country: filters.country });

  return and.length ? { AND: and } : {};
}

/** Сортировка по убыванию; при равенстве — по id (порядок из эталона) */
export function buildFilmOrderBy(sort: SortId = "popular"): Prisma.FilmOrderByWithRelationInput[] {
  switch (sort) {
    case "rating":
      return [{ rating: { sort: "desc", nulls: "last" } }, { id: "asc" }];
    case "new":
      return [{ year: "desc" }, { id: "asc" }];
    case "popular":
      return [{ popularity: "desc" }, { id: "asc" }];
  }
}
