import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const DEFAULT_DATABASE_URL = "file:./data/dev.db";

export function databaseUrl(): string {
  return process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
}

export function isSqliteUrl(url: string): boolean {
  return url.startsWith("file:");
}

/** file:./data/dev.db → абсолютный путь от корня проекта (как в prisma.config.ts) */
export function sqliteFileUrl(url: string): string {
  const file = resolve(process.cwd(), url.slice("file:".length));
  mkdirSync(dirname(file), { recursive: true });
  return `file:${file}`;
}
