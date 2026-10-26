import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { createPrismaClient } from "@/lib/db/client";
import { FILMS } from "@/lib/films/data";
import { seedFilms } from "@/lib/films/seed";

const MIGRATIONS = join(process.cwd(), "prisma", "sqlite", "migrations");

/** Временная SQLite-база с миграциями проекта и (по желанию) фильмами из эталона */
export async function createTestDb({ seed = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "borisjaou-db-"));
  const file = join(dir, "test.db");

  const sqlite = new Database(file);
  for (const name of readdirSync(MIGRATIONS).filter((n) => !n.endsWith(".toml")).sort()) {
    sqlite.exec(readFileSync(join(MIGRATIONS, name, "migration.sql"), "utf8"));
  }
  sqlite.close();

  const db = createPrismaClient(`file:${file}`);
  if (seed) await seedFilms(db, FILMS, "sqlite");

  return {
    db,
    async cleanup() {
      await db.$disconnect();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
