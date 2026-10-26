import type { PrismaClient } from "@/generated/prisma/client";
import type { FavoriteEntry } from "./types";

/** Не больше стольких фильмов в избранном за один перенос */
export const MAX_MERGE = 500;

/** Гостевой формат шага 4 хранил порядковые номера вместо времени — превращаем их в метки времени */
export function normalizeAddedAt(entries: readonly FavoriteEntry[], now = Date.now()): FavoriteEntry[] {
  const REAL_TIME = 1_000_000_000_000; // 2001-09-09 в мс
  return entries.map((e, i) => ({
    filmId: e.filmId,
    addedAt: e.addedAt >= REAL_TIME && e.addedAt <= now ? e.addedAt : now - (entries.length - i) * 1000,
  }));
}

export function createFavoritesRepository(db: PrismaClient) {
  async function list(userId: string): Promise<FavoriteEntry[]> {
    const rows = await db.favorite.findMany({ where: { userId }, orderBy: [{ createdAt: "asc" }, { filmId: "asc" }] });
    return rows.map((r) => ({ filmId: r.filmId, addedAt: r.createdAt.getTime() }));
  }

  async function add(userId: string, filmId: number, addedAt = Date.now()): Promise<void> {
    await db.favorite.upsert({
      where: { userId_filmId: { userId, filmId } },
      create: { userId, filmId, createdAt: new Date(addedAt) },
      update: {},
    });
  }

  async function remove(userId: string, filmId: number): Promise<void> {
    await db.favorite.deleteMany({ where: { userId, filmId } });
  }

  /**
   * Перенос гостевого избранного в аккаунт: уже сохранённые фильмы не трогаем,
   * несуществующие пропускаем. Возвращает итоговый список.
   */
  async function merge(userId: string, entries: readonly FavoriteEntry[]): Promise<FavoriteEntry[]> {
    const guest = normalizeAddedAt(entries.slice(0, MAX_MERGE));
    const existing = new Set(
      (await db.film.findMany({ where: { id: { in: guest.map((e) => e.filmId) } }, select: { id: true } })).map((f) => f.id),
    );
    for (const e of guest) {
      if (existing.has(e.filmId)) await add(userId, e.filmId, e.addedAt);
    }
    return list(userId);
  }

  return { list, add, remove, merge };
}
