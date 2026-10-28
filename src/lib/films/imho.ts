import { z } from "zod";
import { VERDICTS, type Verdict } from "./types";

/** ИМХО автора: оценка и комментарий к фильму (видно всем, пишет только админ) */
export const IMHO_MAX = 1000;

export const IMHO_MESSAGES = {
  tooLong: `Не больше ${IMHO_MAX} символов`,
  empty: "Выберите оценку или напишите комментарий",
  forbidden: "Нет доступа: ИМХО пишет только администратор",
  notFound: "Фильм не найден",
  failed: "Не удалось сохранить. Попробуйте ещё раз",
} as const;

export const imhoSchema = z.object({
  filmId: z.number().int().positive(),
  verdict: z.enum(VERDICTS).nullable(),
  imho: z.string().trim().max(IMHO_MAX, IMHO_MESSAGES.tooLong),
});

export type ImhoInput = z.input<typeof imhoSchema>;

export interface ImhoValue {
  verdict: Verdict | null;
  imho: string;
  imhoAt: string | null;
}

export const VERDICT_LABELS: Record<Verdict, string> = { liked: "Понравился", disliked: "Не понравился" };
