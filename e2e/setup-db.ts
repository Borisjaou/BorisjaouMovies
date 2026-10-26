/**
 * Чистая SQLite-база для e2e: миграции проекта + фильмы из эталона.
 * Запуск: tsx e2e/setup-db.ts data/e2e.db (делает playwright.config.ts → webServer).
 */
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import Database from "better-sqlite3";
import { createPrismaClient } from "../src/lib/db/client";
import { FILMS } from "../src/lib/films/data";
import { seedFilms } from "../src/lib/films/seed";

async function main() {
  const file = resolve(process.argv[2] ?? "data/e2e.db");
  for (const suffix of ["", "-wal", "-shm", "-journal"]) rmSync(file + suffix, { force: true });

  const migrations = join(process.cwd(), "prisma", "sqlite", "migrations");
  const sqlite = new Database(file);
  for (const name of readdirSync(migrations).filter((n) => !n.endsWith(".toml")).sort()) {
    sqlite.exec(readFileSync(join(migrations, name, "migration.sql"), "utf8"));
  }
  sqlite.close();

  const db = createPrismaClient(`file:${file}`);
  await seedFilms(db, FILMS, "sqlite");
  console.log(`e2e: база ${file}, фильмов: ${await db.film.count()}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
