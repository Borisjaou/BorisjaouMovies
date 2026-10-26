/** Проверка загружаемой картинки по содержимому, а не по имени файла и заявленному типу */

/** 4 МБ: на Vercel весь запрос к серверу ограничен 4,5 МБ (постер + поля формы) */
export const POSTER_MAX_BYTES = 4 * 1024 * 1024;

export type ImageKind = { extension: "jpg" | "png" | "webp"; contentType: string };

export function detectImage(bytes: Uint8Array): ImageKind | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { extension: "jpg", contentType: "image/jpeg" };
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return { extension: "png", contentType: "image/png" };
  }
  if (
    b.length >= 12 &&
    String.fromCharCode(b[0], b[1], b[2], b[3]) === "RIFF" &&
    String.fromCharCode(b[8], b[9], b[10], b[11]) === "WEBP"
  ) {
    return { extension: "webp", contentType: "image/webp" };
  }
  return null;
}

/** Постер: форматы из эталона — «JPG, PNG» */
export const POSTER_TYPES: readonly ImageKind["extension"][] = ["jpg", "png"];
export const POSTER_ERROR = "Постер — JPG или PNG, не больше 4 МБ";
