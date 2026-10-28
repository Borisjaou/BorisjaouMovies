import type { PrismaClient } from "@/generated/prisma/client";
import { normalizeAddedAt } from "@/lib/favorites/repository";
import { isWatchListId, type WatchEntry, type WatchListId } from "./types";

/** Не больше стольких записей за один перенос гостевых списков */
export const MAX_WATCH_MERGE = 1000;

export function createWatchListsRepository(db: PrismaClient) {
  async function list(userId: string): Promise<WatchEntry[]> {
    const rows = await db.watchItem.findMany({ where: { userId }, orderBy: [{ createdAt: "asc" }, { filmId: "asc" }] });
    return rows.flatMap((r) =>
      isWatchListId(r.list) ? [{ filmId: r.filmId, addedAt: r.createdAt.getTime(), list: r.list }] : [],
    );
  }

  /** Добавить в список; если фильм был в другом — переносится (дата добавления обновляется) */
  async function set(userId: string, filmId: number, target: WatchListId, addedAt = Date.now()): Promise<void> {
    const createdAt = new Date(addedAt);
    await db.watchItem.upsert({
      where: { userId_filmId: { userId, filmId } },
      create: { userId, filmId, list: target, createdAt },
      update: { list: target, createdAt },
    });
  }

  async function remove(userId: string, filmId: number, target: WatchListId): Promise<void> {
    await db.watchItem.deleteMany({ where: { userId, filmId, list: target } });
  }

  /**
   * Перенос гостевых списков в аккаунт: уже сохранённые фильмы не трогаем,
   * несуществующие пропускаем. Возвращает итоговые списки.
   */
  async function merge(userId: string, entries: readonly WatchEntry[]): Promise<WatchEntry[]> {
    const guest = entries.slice(0, MAX_WATCH_MERGE);
    const times = normalizeAddedAt(guest);
    const ids = guest.map((e) => e.filmId);
    const films = new Set((await db.film.findMany({ where: { id: { in: ids } }, select: { id: true } })).map((f) => f.id));
    const saved = new Set(
      (await db.watchItem.findMany({ where: { userId, filmId: { in: ids } }, select: { filmId: true } })).map((r) => r.filmId),
    );
    for (const [i, e] of guest.entries()) {
      if (!films.has(e.filmId) || saved.has(e.filmId)) continue;
      await set(userId, e.filmId, e.list, times[i].addedAt);
      saved.add(e.filmId);
    }
    return list(userId);
  }

  return { list, set, remove, merge };
}
