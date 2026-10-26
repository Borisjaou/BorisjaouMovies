import { createRequire } from "node:module";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseUrl, isSqliteUrl, sqliteFileUrl } from "./url";

type SqliteAdapterModule = typeof import("@prisma/adapter-better-sqlite3");

/**
 * Адаптер SQLite подключается только когда нужен (разработка, тесты).
 * На сервере с PostgreSQL (Vercel) нативный better-sqlite3 не загружается и может вообще не ставиться
 * (он в optionalDependencies).
 */
function sqliteAdapter(url: string) {
  const load = createRequire(import.meta.url);
  const { PrismaBetterSqlite3 } = load("@prisma/adapter-better-sqlite3") as SqliteAdapterModule;
  return new PrismaBetterSqlite3({ url: sqliteFileUrl(url) });
}

/**
 * Клиент под текущую базу: SQLite (file:…) для разработки, PostgreSQL — для продакшена.
 * Сгенерированный клиент должен соответствовать провайдеру: `prisma generate`
 * берёт схему по тому же DATABASE_URL (prisma.config.ts).
 */
export function createPrismaClient(url = databaseUrl()): PrismaClient {
  const adapter = isSqliteUrl(url) ? sqliteAdapter(url) : new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export type { PrismaClient };
