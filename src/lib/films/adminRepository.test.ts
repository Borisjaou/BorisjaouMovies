import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { createAdminFilmsRepository, posterLookFor } from "./adminRepository";
import { checkFilmForm, EMPTY_FILM_FORM, type FilmInput } from "./filmForm";
import { createFilmsRepository } from "./repository";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

function input(patch: Partial<typeof EMPTY_FILM_FORM> = {}): FilmInput {
  const r = checkFilmForm({ ...EMPTY_FILM_FORM, title: "Новый фильм", year: "2026", genres: ["Драма"], ...patch });
  if (!r.data) throw new Error("invalid test input");
  return r.data;
}

describe("admin films repository", () => {
  let t: TestDb;
  let admin: ReturnType<typeof createAdminFilmsRepository>;
  let site: ReturnType<typeof createFilmsRepository>;

  beforeAll(async () => {
    t = await createTestDb();
    admin = createAdminFilmsRepository(t.db);
    site = createFilmsRepository(t.db);
  });
  afterAll(() => t.cleanup());

  it("список: все фильмы, включая черновики, новые по году сверху", async () => {
    const films = await admin.listAll();
    expect(films.some((f) => f.status === "draft")).toBe(true);
    expect(films.map((f) => f.year)).toEqual([...films.map((f) => f.year)].sort((a, b) => b - a));
  });

  it("черновик не виден на сайте, после публикации — виден", async () => {
    const draft = await admin.create(input({ title: "Лунный сад", description: "Сад на Луне." }), {
      status: "draft",
      slug: "lunnyy-sad",
      posterUrl: null,
    });
    expect(draft).toMatchObject({ slug: "lunnyy-sad", status: "draft", popularity: 0 });
    expect(draft.shortDescription).toBe("Сад на Луне.");
    expect(draft.posterColor).toBe(posterLookFor("lunnyy-sad").posterColor);
    expect(await site.getFilmBySlug("lunnyy-sad")).toBeNull();

    const published = await admin.update(draft.id, input({ title: "Лунный сад", description: "Сад на Луне." }), {
      status: "published",
      slug: "lunnyy-sad",
    });
    expect(published.status).toBe("published");
    expect((await site.getFilms({ query: "лунный" })).items.map((f) => f.slug)).toEqual(["lunnyy-sad"]);
  });

  it("правка: жанры заменяются, постер не меняется без нового файла, поиск обновляется", async () => {
    const film = await admin.create(input({ title: "Эхо" }), { status: "published", slug: "eho", posterUrl: "/uploads/posters/a.png" });
    const updated = await admin.update(
      film.id,
      input({ title: "Эхо", genres: ["Триллер", "Детектив"], director: "Ирина Сомова" }),
      { status: "published", slug: "eho" },
    );
    expect(updated.genres).toEqual(["Триллер", "Детектив"]);
    expect(updated.posterUrl).toBe("/uploads/posters/a.png");
    expect((await site.getFilms({ query: "сомова" })).items.map((f) => f.slug)).toEqual(["eho"]);
  });

  it("короткое описание меняется только вместе с описанием", async () => {
    const seeded = (await admin.listAll()).find((f) => f.shortDescription !== f.description);
    if (!seeded) throw new Error("в эталоне есть фильмы с отдельным коротким описанием");
    const same = await admin.update(
      seeded.id,
      input({ title: seeded.title, year: String(seeded.year), description: seeded.description }),
      { status: seeded.status, slug: seeded.slug },
    );
    expect(same.shortDescription).toBe(seeded.shortDescription);
    const changed = await admin.update(seeded.id, input({ title: seeded.title, description: "Новый текст." }), {
      status: seeded.status,
      slug: seeded.slug,
    });
    expect(changed.shortDescription).toBe("Новый текст.");
  });

  it("ИМХО: оценка и комментарий; «не понравился» убирает из каталога; пустое — без даты", async () => {
    const film = await site.getFilmBySlug("tihiy-bereg");
    if (!film) throw new Error("нет данных");
    const liked = await admin.setImho(film.id, { verdict: "liked", imho: "Пересмотрю" });
    expect(liked).toMatchObject({ verdict: "liked", imho: "Пересмотрю" });
    expect(liked.imhoAt).not.toBeNull();

    await admin.setImho(film.id, { verdict: "disliked", imho: "" });
    expect((await site.getFilms()).items.some((f) => f.id === film.id)).toBe(false);
    expect((await site.getFilms({ pit: true })).items.map((f) => f.id)).toContain(film.id);

    const cleared = await admin.setImho(film.id, { verdict: null, imho: "" });
    expect(cleared).toMatchObject({ verdict: null, imho: "", imhoAt: null });
    expect((await site.getFilms()).items.some((f) => f.id === film.id)).toBe(true);
  });

  it("занятая ссылка", async () => {
    const film = (await admin.listAll())[0];
    expect(await admin.isSlugTaken(film.slug)).toBe(true);
    expect(await admin.isSlugTaken(film.slug, film.id)).toBe(false);
    expect(await admin.isSlugTaken("net-takogo")).toBe(false);
  });
});
