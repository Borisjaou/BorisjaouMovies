import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { createTestDb } from "@/test/db";
import { createFavoritesRepository, normalizeAddedAt } from "./repository";

let db: PrismaClient;
let cleanup: () => Promise<void>;
let userId = "";

beforeAll(async () => {
  ({ db, cleanup } = await createTestDb());
  userId = (await db.user.create({ data: { email: "u@x.ru", name: "U" } })).id;
});
afterAll(() => cleanup());

describe("createFavoritesRepository", () => {
  it("add / list / remove, повторное добавление не дублирует", async () => {
    const repo = createFavoritesRepository(db);
    await repo.add(userId, 2, 2_000_000_000_000);
    await repo.add(userId, 5, 2_000_000_001_000);
    await repo.add(userId, 2, 2_000_000_009_000);
    expect(await repo.list(userId)).toEqual([
      { filmId: 2, addedAt: 2_000_000_000_000 },
      { filmId: 5, addedAt: 2_000_000_001_000 },
    ]);
    await repo.remove(userId, 2);
    await repo.remove(userId, 999);
    expect((await repo.list(userId)).map((e) => e.filmId)).toEqual([5]);
  });

  it("merge: переносит гостевые, не трогает сохранённые, пропускает несуществующие фильмы", async () => {
    const repo = createFavoritesRepository(db);
    const now = Date.now();
    const merged = await repo.merge(userId, [
      { filmId: 5, addedAt: now - 100 }, // уже есть — дата остаётся прежней
      { filmId: 8, addedAt: now - 50 },
      { filmId: 777, addedAt: now - 10 }, // такого фильма нет
    ]);
    expect(merged.map((e) => e.filmId).sort((a, b) => a - b)).toEqual([5, 8]);
    expect(merged.find((e) => e.filmId === 5)?.addedAt).toBe(2_000_000_001_000);
  });

  it("избранное удаляется вместе с пользователем", async () => {
    const other = await db.user.create({ data: { email: "o@x.ru", name: "O" } });
    const repo = createFavoritesRepository(db);
    await repo.add(other.id, 1);
    await db.user.delete({ where: { id: other.id } });
    expect(await db.favorite.count({ where: { userId: other.id } })).toBe(0);
  });
});

describe("normalizeAddedAt", () => {
  it("порядковые номера старого формата превращаются в метки времени в том же порядке", () => {
    const now = 1_800_000_000_000;
    const out = normalizeAddedAt(
      [
        { filmId: 1, addedAt: 0 },
        { filmId: 2, addedAt: 1 },
        { filmId: 3, addedAt: 1_700_000_000_000 },
      ],
      now,
    );
    expect(out[0].addedAt).toBeLessThan(out[1].addedAt);
    expect(out[1].addedAt).toBeLessThan(now);
    expect(out[2].addedAt).toBe(1_700_000_000_000);
  });
});
