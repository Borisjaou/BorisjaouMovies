import type { PrismaClient } from "@/generated/prisma/client";
import { toFilmData } from "./mapper";
import type { Film } from "./types";

/**
 * Заливает фильмы с их id (повторный запуск обновляет, а не дублирует).
 * id важны: гостевое избранное в браузере хранит именно их.
 */
export async function seedFilms(db: PrismaClient, films: readonly Film[], provider: "sqlite" | "postgresql"): Promise<void> {
  for (const film of films) {
    const data = toFilmData(film);
    const genres = film.genres.map((genre, position) => ({ genre, position }));
    await db.film.upsert({
      where: { id: film.id },
      create: { id: film.id, ...data, genres: { create: genres } },
      update: { ...data, genres: { deleteMany: {}, create: genres } },
    });
  }

  // PostgreSQL: после вставки явных id сдвигаем счётчик, иначе новый фильм получит занятый id
  if (provider === "postgresql") {
    await db.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"Film"', 'id'), GREATEST((SELECT MAX(id) FROM "Film"), 1))`,
    );
  }
}
