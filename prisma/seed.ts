/**
 * Сид: фильмы из эталона (+ пользователи из data/users.json, если он остался с шага 7).
 * Запуск: npm run db:seed (или автоматически после `prisma migrate reset`).
 * Повторный запуск безопасен: фильмы обновляются по id, пользователи — пропускаются, если уже есть.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  // Импорты после загрузки .env: клиенту нужен DATABASE_URL
  const { createPrismaClient } = await import("../src/lib/db/client");
  const { databaseUrl, isSqliteUrl } = await import("../src/lib/db/url");
  const { FILMS } = await import("../src/lib/films/data");
  const { seedFilms } = await import("../src/lib/films/seed");

  const url = databaseUrl();
  const db = createPrismaClient(url);
  try {
    await seedFilms(db, FILMS, isSqliteUrl(url) ? "sqlite" : "postgresql");
    console.log(`Фильмы: ${FILMS.length}`);

    const legacy = join(process.cwd(), "data", "users.json");
    if (existsSync(legacy)) {
      const users: unknown = JSON.parse(readFileSync(legacy, "utf8"));
      let imported = 0;
      for (const u of Array.isArray(users) ? users : []) {
        const { email, name, passwordHash, role, providers } = u as Record<string, unknown>;
        if (typeof email !== "string" || typeof name !== "string") continue;
        if (await db.user.findUnique({ where: { email: email.toLowerCase() } })) continue;
        await db.user.create({
          data: {
            email: email.toLowerCase(),
            name,
            passwordHash: typeof passwordHash === "string" ? passwordHash : null,
            role: role === "admin" ? "admin" : "user",
            googleLinked: Array.isArray(providers) && providers.includes("google"),
          },
        });
        imported += 1;
      }
      console.log(`Пользователи из data/users.json: ${imported}`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
