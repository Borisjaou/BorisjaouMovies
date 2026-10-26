import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    // Позволяет писать @use "breakpoints" as bp; из любого *.module.scss
    loadPaths: [path.join(process.cwd(), "src/styles")],
  },
  // Нативный драйвер SQLite и адаптеры Prisma не упаковываются сборщиком
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3", "@prisma/adapter-pg", "pg"],
  experimental: {
    // Постер до 4 МБ уходит в серверное действие вместе с полями формы (по умолчанию лимит 1 МБ).
    // Больше 4,5 МБ не пропустит Vercel — лимит тела запроса функции.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
};

export default nextConfig;
