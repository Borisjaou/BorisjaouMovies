import "server-only";
import { createLocalFileStorage } from "./local";
import { createSupabaseFileStorage } from "./supabase";
import type { FileStorage } from "./types";

let storage: FileStorage | null = null;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Не задана переменная окружения ${name} (нужна для STORAGE_DRIVER=supabase)`);
  return value;
}

/**
 * Единственное место выбора хранилища постеров (STORAGE_DRIVER):
 * - local — public/uploads, для разработки и сервера с постоянным диском;
 * - supabase — Supabase Storage, для Vercel.
 * Другое хранилище (S3, Cloudinary): реализовать FileStorage и добавить сюда.
 */
export function getFileStorage(): FileStorage {
  if (storage) return storage;
  const driver = process.env.STORAGE_DRIVER ?? "local";
  switch (driver) {
    case "local":
      storage = createLocalFileStorage();
      break;
    case "supabase":
      storage = createSupabaseFileStorage({
        url: required("SUPABASE_URL"),
        serviceKey: required("SUPABASE_SERVICE_ROLE_KEY"),
        bucket: process.env.SUPABASE_STORAGE_BUCKET || "posters",
      });
      break;
    default:
      throw new Error(`Неизвестный STORAGE_DRIVER: ${driver}. Доступно: local, supabase`);
  }
  return storage;
}

export type { FileStorage, StoredFile } from "./types";
