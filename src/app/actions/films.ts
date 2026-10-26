"use server";

import { z } from "zod";
import { getFilms, MAX_IDS } from "@/lib/films";
import { parseCatalogQuery, searchParamsToRecord, toFilmFilters } from "@/lib/films/params";
import type { Film, FilmPage } from "@/lib/films/types";

const pageSchema = z.number().int().min(1).max(10_000);
const idsSchema = z.array(z.number().int().positive()).max(MAX_IDS);

function filtersFrom(search: string) {
  return toFilmFilters(parseCatalogQuery(searchParamsToRecord(new URLSearchParams(search))));
}

/** Следующая страница каталога (подгрузка при прокрутке) */
export async function loadFilmsPageAction(search: string, page: number): Promise<FilmPage> {
  return getFilms(filtersFrom(search), { page: pageSchema.parse(page) });
}

/**
 * Фильмы из избранного с фильтрами и сортировкой каталога.
 * id приходят с клиента: у гостя — из localStorage, у пользователя — из базы через контекст.
 */
export async function favoriteFilmsAction(ids: number[], search = ""): Promise<Film[]> {
  const list = idsSchema.parse(ids);
  if (list.length === 0) return [];
  return (await getFilms({ ...filtersFrom(search), ids: list }, { pageSize: MAX_IDS })).items;
}
