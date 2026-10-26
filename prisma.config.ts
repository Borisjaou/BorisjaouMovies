import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Те же .env-файлы, что читает Next.js (.env, .env.local, .env.development…)
loadEnvConfig(process.cwd());

const DEFAULT_URL = "file:./data/dev.db";
const url = process.env.DATABASE_URL || DEFAULT_URL;
const isSqlite = url.startsWith("file:");
const sqliteFile = isSqlite ? resolve(process.cwd(), url.slice("file:".length)) : "";
// Папка для файла SQLite (data/) может ещё не существовать
if (isSqlite) mkdirSync(dirname(sqliteFile), { recursive: true });

/**
 * SQLite (разработка): DATABASE_URL=file:./data/dev.db  → prisma/sqlite/…
 * PostgreSQL:          DATABASE_URL=postgresql://…      → prisma/…
 */
export default defineConfig({
  schema: isSqlite ? "prisma/sqlite/schema.prisma" : "prisma/schema.prisma",
  migrations: {
    path: isSqlite ? "prisma/sqlite/migrations" : "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // путь к файлу SQLite — от корня проекта, как и в приложении.
    // PostgreSQL: миграции идут по прямому подключению (DIRECT_URL), если оно задано —
    // пулер Neon / Supabase (DATABASE_URL) не подходит для migrate.
    url: isSqlite ? `file:${sqliteFile}` : process.env.DIRECT_URL || url,
  },
});
