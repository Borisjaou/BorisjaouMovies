import "server-only";
import { prisma } from "@/lib/db";
import { createFilmsRepository } from "./repository";

/** Доступ к фильмам (Prisma). Фильтры и сортировка — в запросе, страницы по 20. */
const repo = createFilmsRepository(prisma);

export const getFilms = repo.getFilms;
export const getFilmBySlug = repo.getFilmBySlug;
export const getSimilarFilms = repo.getSimilarFilms;
export const getNewFilms = repo.getNewFilms;
export const getPublishedSlugs = repo.getPublishedSlugs;

export { PAGE_SIZE, MAX_IDS } from "./repository";
export * from "./constants";
export type * from "./types";
export { slugify, DEFAULT_SLUG } from "./slugify";
export * from "./params";
export * from "./format";
