"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { adminFilms } from "@/lib/films/admin";
import { IMHO_MESSAGES, imhoSchema, type ImhoInput, type ImhoValue } from "@/lib/films/imho";

export type SaveImhoResult = { ok: true; value: ImhoValue } | { ok: false; error: string };

/** ИМХО к фильму: оценка «понравился / не понравился» и комментарий. Только админ. */
export async function saveImhoAction(input: ImhoInput): Promise<SaveImhoResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: IMHO_MESSAGES.forbidden };
  }
  const parsed = imhoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? IMHO_MESSAGES.failed };

  const film = await adminFilms.getById(parsed.data.filmId);
  if (!film) return { ok: false, error: IMHO_MESSAGES.notFound };

  try {
    const saved = await adminFilms.setImho(film.id, { verdict: parsed.data.verdict, imho: parsed.data.imho });
    // «Не понравился» убирает фильм из каталога и переносит в «Яму» — обновляем все страницы
    revalidatePath("/", "layout");
    return { ok: true, value: { verdict: saved.verdict, imho: saved.imho, imhoAt: saved.imhoAt } };
  } catch {
    return { ok: false, error: IMHO_MESSAGES.failed };
  }
}
