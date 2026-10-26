import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FILMS } from "@/lib/films/data";
import { FAVORITES_KEY, createLocalFavoritesStorage, parseEntries } from "./localStorage";
import { favoriteFilms } from "./sort";

describe("parseEntries", () => {
  it("новый формат", () => {
    expect(parseEntries('[{"filmId":2,"addedAt":10},{"filmId":5,"addedAt":20}]')).toEqual([
      { filmId: 2, addedAt: 10 },
      { filmId: 5, addedAt: 20 },
    ]);
  });

  it("старый формат шага 4: массив id, порядок = порядок добавления", () => {
    expect(parseEntries("[1,2,5]")).toEqual([
      { filmId: 1, addedAt: 0 },
      { filmId: 2, addedAt: 1 },
      { filmId: 5, addedAt: 2 },
    ]);
  });

  it("мусор и дубли отбрасываются", () => {
    expect(parseEntries(null)).toEqual([]);
    expect(parseEntries("не json")).toEqual([]);
    expect(parseEntries('{"a":1}')).toEqual([]);
    expect(parseEntries('[1,"x",1.5,{"filmId":"2"},1]')).toEqual([{ filmId: 1, addedAt: 0 }]);
  });
});

describe("createLocalFavoritesStorage", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    const localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    Object.assign(globalThis, { window: { localStorage } });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("добавляет, не дублирует и удаляет", async () => {
    const storage = createLocalFavoritesStorage();
    await storage.add({ filmId: 2, addedAt: 100 });
    await storage.add({ filmId: 5, addedAt: 200 });
    await storage.add({ filmId: 2, addedAt: 300 });
    expect(await storage.load()).toEqual([
      { filmId: 5, addedAt: 200 },
      { filmId: 2, addedAt: 300 },
    ]);
    await storage.remove(5);
    expect(await storage.load()).toEqual([{ filmId: 2, addedAt: 300 }]);
    expect(store.get(FAVORITES_KEY)).toBe('[{"filmId":2,"addedAt":300}]');
  });

  it("читает старый формат", async () => {
    store.set(FAVORITES_KEY, "[8,1]");
    expect((await createLocalFavoritesStorage().load()).map((e) => e.filmId)).toEqual([8, 1]);
  });
});

describe("favoriteFilms", () => {
  // Как в Favorites.dc.html: Орбита 9 (added 4), Тихий берег (3), Бумажный кит (2), Звёздная пыль (1)
  const entries = [
    { filmId: 8, addedAt: 1 },
    { filmId: 5, addedAt: 2 },
    { filmId: 1, addedAt: 3 },
    { filmId: 2, addedAt: 4 },
  ];
  const titles = (sort: "recent" | "rating" | "year") => favoriteFilms(FILMS, entries, sort).map((f) => f.title);

  it("Недавние", () => {
    expect(titles("recent")).toEqual(["Орбита 9", "Тихий берег", "Бумажный кит", "Звёздная пыль"]);
  });

  it("Рейтинг", () => {
    expect(titles("rating")).toEqual(["Орбита 9", "Тихий берег", "Бумажный кит", "Звёздная пыль"]);
  });

  it("Год", () => {
    expect(titles("year")).toEqual(["Тихий берег", "Орбита 9", "Бумажный кит", "Звёздная пыль"]);
  });

  it("пропускает фильмы, которых нет в списке", () => {
    expect(favoriteFilms(FILMS, [{ filmId: 999, addedAt: 1 }], "recent")).toEqual([]);
  });
});
