import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import type { FileStorage } from "./types";

export const UPLOADS_URL_PREFIX = "/uploads/";
const DEFAULT_ROOT = join(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Файлы в public/uploads — раздаются по /uploads/… */
export function createLocalFileStorage(root = DEFAULT_ROOT): FileStorage {
  const resolveKey = (key: string): string | null => {
    const path = normalize(join(root, key));
    // Защита от выхода за пределы папки (../)
    return path.startsWith(root + sep) ? path : null;
  };

  return {
    async save({ data, extension, folder }) {
      const key = `${folder}/${randomUUID()}.${extension}`;
      const path = resolveKey(key);
      if (!path) throw new Error("INVALID_KEY");
      await mkdir(join(root, folder), { recursive: true });
      await writeFile(path, data);
      return { key, url: `${UPLOADS_URL_PREFIX}${key}` };
    },
    async deleteByUrl(url) {
      if (!url.startsWith(UPLOADS_URL_PREFIX)) return;
      const path = resolveKey(url.slice(UPLOADS_URL_PREFIX.length));
      if (!path) return;
      await unlink(path).catch(() => undefined); // уже удалён — не ошибка
    },
  };
}

/**
 * Чтение загруженного файла для /uploads/… .
 * `next start` раздаёт из public только файлы, которые были там при сборке, — загруженные позже отдаёт этот код.
 */
export async function readLocalUpload(
  segments: readonly string[],
  root = DEFAULT_ROOT,
): Promise<{ data: Buffer; contentType: string } | null> {
  const key = segments.join("/");
  const contentType = CONTENT_TYPES[key.split(".").pop()?.toLowerCase() ?? ""];
  if (!contentType || segments.some((s) => s === ".." || s.includes("\\"))) return null;
  const path = normalize(join(root, key));
  if (!path.startsWith(root + sep)) return null;
  try {
    return { data: await readFile(path), contentType };
  } catch {
    return null;
  }
}
