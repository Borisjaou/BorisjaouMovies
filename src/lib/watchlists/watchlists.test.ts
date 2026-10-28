import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { createTestDb } from "@/test/db";
import { WATCH_LISTS_KEY, createLocalWatchStorage, parseWatchEntries } from "./localStorage";
import { createWatchListsRepository } from "./repository";

describe("parseWatchEntries", () => {
  it("отбрасывает мусор, у фильма остаётся последняя запись", () => {
    expect(parseWatchEntries(null)).toEqual([]);
    expect(parseWatchEntries("не json")).toEqual([]);
    expect(
      parseWatchEntries(
        '[{"filmId":1,"addedAt":1,"list":"watchlist"},{"filmId":2,"addedAt":2,"list":"later"},{"filmId":1,"addedAt":3,"list":"watched"}]',
      ),
    ).toEqual([{ filmId: 1, addedAt: 3, list: "watched" }]);
  });
});

describe("createLocalWatchStorage", () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    const localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    Object.assign(globalThis, { window: { localStorage } });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("фильм переносится между списками, удаление — только из своего списка", async () => {
    const storage = createLocalWatchStorage();
    await storage.set({ filmId: 2, addedAt: 100, list: "watchlist" });
    await storage.set({ filmId: 2, addedAt: 200, list: "watched" });
    expect(await storage.load()).toEqual([{ filmId: 2, addedAt: 200, list: "watched" }]);
    await storage.remove(2, "watchlist");
    expect(await storage.load()).toHaveLength(1);
    await storage.remove(2, "watched");
    expect(await storage.load()).toEqual([]);
    expect(store.get(WATCH_LISTS_KEY)).toBe("[]");
  });
});

describe("createWatchListsRepository", () => {
  let db: PrismaClient;
  let cleanup: () => Promise<void>;
  let userId = "";

  beforeAll(async () => {
    ({ db, cleanup } = await createTestDb());
    userId = (await db.user.create({ data: { email: "w@x.ru", name: "W" } })).id;
  });
  afterAll(() => cleanup());

  it("set переносит фильм между списками, а не дублирует", async () => {
    const repo = createWatchListsRepository(db);
    await repo.set(userId, 2, "watchlist", 2_000_000_000_000);
    await repo.set(userId, 5, "watchlist", 2_000_000_001_000);
    await repo.set(userId, 2, "watched", 2_000_000_002_000);
    expect(await repo.list(userId)).toEqual([
      { filmId: 5, addedAt: 2_000_000_001_000, list: "watchlist" },
      { filmId: 2, addedAt: 2_000_000_002_000, list: "watched" },
    ]);
    await repo.remove(userId, 2, "watchlist");
    expect(await repo.list(userId)).toHaveLength(2);
    await repo.remove(userId, 2, "watched");
    expect((await repo.list(userId)).map((e) => e.filmId)).toEqual([5]);
  });

  it("merge: сохранённые не трогает, несуществующие фильмы пропускает", async () => {
    const repo = createWatchListsRepository(db);
    const now = Date.now();
    const merged = await repo.merge(userId, [
      { filmId: 5, addedAt: now - 100, list: "watched" }, // уже в «Надо посмотреть» — остаётся там
      { filmId: 8, addedAt: now - 50, list: "watched" },
      { filmId: 777, addedAt: now - 10, list: "watchlist" },
    ]);
    expect(merged.map((e) => [e.filmId, e.list]).sort((a, b) => Number(a[0]) - Number(b[0]))).toEqual([
      [5, "watchlist"],
      [8, "watched"],
    ]);
  });

  it("списки удаляются вместе с пользователем", async () => {
    const other = await db.user.create({ data: { email: "o2@x.ru", name: "O" } });
    await createWatchListsRepository(db).set(other.id, 1, "watchlist");
    await db.user.delete({ where: { id: other.id } });
    expect(await db.watchItem.count({ where: { userId: other.id } })).toBe(0);
  });
});
