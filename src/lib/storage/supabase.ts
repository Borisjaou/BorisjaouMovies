import { randomUUID } from "node:crypto";
import type { FileStorage } from "./types";

export interface SupabaseStorageOptions {
  /** https://<project>.supabase.co */
  url: string;
  /** service_role — только на сервере, в браузер не попадает */
  serviceKey: string;
  /** Публичный bucket, например "posters" */
  bucket: string;
  fetchImpl?: typeof fetch;
}

/**
 * Supabase Storage через REST API (без SDK). Файлы лежат в публичном bucket,
 * адрес для <img>: {url}/storage/v1/object/public/{bucket}/{key}.
 * Подходит для Vercel: диск там только для чтения, public/uploads не работает.
 */
export function createSupabaseFileStorage({ url, serviceKey, bucket, fetchImpl = fetch }: SupabaseStorageOptions): FileStorage {
  const base = url.replace(/\/+$/, "");
  const publicPrefix = `${base}/storage/v1/object/public/${bucket}/`;
  const headers = { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey };

  return {
    async save({ data, contentType, extension, folder }) {
      const key = `${folder}/${randomUUID()}.${extension}`;
      const res = await fetchImpl(`${base}/storage/v1/object/${bucket}/${key}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": contentType, "Cache-Control": "31536000", "x-upsert": "false" },
        body: new Blob([new Uint8Array(data)], { type: contentType }),
      });
      if (!res.ok) throw new Error(`Supabase Storage: ${res.status} ${await res.text().catch(() => "")}`);
      return { key, url: publicPrefix + key };
    },
    async deleteByUrl(fileUrl) {
      if (!fileUrl.startsWith(publicPrefix)) return; // чужой адрес (например, старый локальный постер)
      const key = fileUrl.slice(publicPrefix.length);
      await fetchImpl(`${base}/storage/v1/object/${bucket}`, {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: [key] }),
      }).catch(() => undefined); // не удалось удалить старый файл — не повод ронять сохранение фильма
    },
  };
}
