// Генерирует prisma/sqlite/schema.prisma из prisma/schema.prisma (PostgreSQL).
// Модели общие, отличаются только provider и путь output генератора.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SOURCE = join(root, "prisma", "schema.prisma");
export const TARGET = join(root, "prisma", "sqlite", "schema.prisma");

export function toSqlite(schema) {
  const out = schema
    .replace('provider = "postgresql"', 'provider = "sqlite"')
    .replace('output   = "../src/generated/prisma"', 'output   = "../../src/generated/prisma"')
    .replace(/^\/\/ Основная схема[^\n]*\n\/\/[^\n]*\n/m, "// СГЕНЕРИРОВАНО `npm run db:sync` из prisma/schema.prisma — не редактировать.\n");
  if (!out.includes('provider = "sqlite"') || !out.includes("../../src/generated/prisma")) {
    throw new Error("prisma-sync-sqlite: не удалось заменить provider или output");
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(dirname(TARGET), { recursive: true });
  writeFileSync(TARGET, toSqlite(readFileSync(SOURCE, "utf8")));
  console.log("prisma/sqlite/schema.prisma обновлён");
}
