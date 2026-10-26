import { readLocalUpload } from "@/lib/storage/local";

/** Постеры из public/uploads, загруженные после сборки (только для локального хранилища) */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const file = await readLocalUpload((await params).path);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      // Имя файла уникально (uuid) и не переиспользуется — можно кэшировать надолго
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
