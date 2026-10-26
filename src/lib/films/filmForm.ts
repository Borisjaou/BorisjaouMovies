import { z } from "zod";
import { AGE_RATINGS, GENRES, type AgeRating, type Genre } from "./constants";
import type { Film } from "./types";

/**
 * Форма фильма в админке (AdminAdd / DeskAdminAdd).
 * Одна проверка на клиенте и на сервере: обязательные поля — как в эталоне
 * (плашка «Заполните обязательные поля: название, год, жанр» + красная рамка),
 * остальные ошибки формата — текстом под полем.
 */

export const YEAR_MIN = 1895;
export const YEAR_MAX = 2030;
export const DESCRIPTION_MAX = 600;

/** Значения полей формы — строки, как в инпутах */
export interface FilmFormValues {
  title: string;
  originalTitle: string;
  year: string;
  durationMin: string;
  genres: Genre[];
  ageRating: AgeRating | "";
  /** "" — «Не указана» */
  country: string;
  director: string;
  /** Через запятую */
  cast: string;
  description: string;
  trailerUrl: string;
  isNew: boolean;
}

export const EMPTY_FILM_FORM: FilmFormValues = {
  title: "",
  originalTitle: "",
  year: "",
  durationMin: "",
  genres: [],
  ageRating: "16+", // в эталоне по умолчанию выбран 16+
  country: "",
  director: "",
  cast: "",
  description: "",
  trailerUrl: "",
  isNew: true, // «Показать в «Новинках»» включено по умолчанию
};

/** Проверенные данные для записи в базу */
export interface FilmInput {
  title: string;
  originalTitle: string | null;
  year: number;
  durationMin: number | null;
  genres: Genre[];
  ageRating: AgeRating | null;
  country: string | null;
  director: string | null;
  cast: string[];
  description: string;
  trailerUrl: string | null;
  isNew: boolean;
}

export type FilmFormField = keyof FilmFormValues;
export type RequiredField = "title" | "year" | "genres";

/** Порядок и слова — как в эталоне: «название, год, жанр» */
export const REQUIRED_LABELS: Record<RequiredField, string> = { title: "название", year: "год", genres: "жанр" };

export const FILM_FORM_MESSAGES = {
  tooLong: (max: number) => `Не больше ${max} символов`,
  year: `Год — от ${YEAR_MIN} до ${YEAR_MAX}`,
  duration: "Длительность — целое число минут, от 1 до 999",
  trailer: "Ссылка должна начинаться с http:// или https://",
  slugTaken: "Фильм с такой ссылкой уже есть — измените название",
} as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, FILM_FORM_MESSAGES.tooLong(max))
    .transform((v) => v || null);

const formatSchema = z.object({
  title: z.string().trim().max(120, FILM_FORM_MESSAGES.tooLong(120)),
  originalTitle: optionalText(120),
  year: z.string().trim(),
  durationMin: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 999), FILM_FORM_MESSAGES.duration)
    .transform((v) => (v ? Number(v) : null)),
  genres: z.array(z.enum(GENRES)),
  ageRating: z.union([z.enum(AGE_RATINGS), z.literal("")]).transform((v) => v || null),
  country: optionalText(60),
  director: optionalText(120),
  cast: z
    .string()
    .max(500, FILM_FORM_MESSAGES.tooLong(500))
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  description: z.string().trim().max(DESCRIPTION_MAX, FILM_FORM_MESSAGES.tooLong(DESCRIPTION_MAX)),
  trailerUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+/.test(v), FILM_FORM_MESSAGES.trailer)
    .transform((v) => v || null),
  isNew: z.boolean(),
});

export interface FilmFormCheck {
  data: FilmInput | null;
  /** Незаполненные обязательные поля — в порядке эталона */
  missing: RequiredField[];
  /** Ошибки формата: текст под полем */
  fieldErrors: Partial<Record<FilmFormField, string>>;
}

export function checkFilmForm(values: FilmFormValues): FilmFormCheck {
  const missing: RequiredField[] = [];
  if (!values.title.trim()) missing.push("title");
  if (!values.year.trim()) missing.push("year");
  if (values.genres.length === 0) missing.push("genres");

  const fieldErrors: Partial<Record<FilmFormField, string>> = {};
  const year = values.year.trim();
  if (year && !(/^\d{4}$/.test(year) && Number(year) >= YEAR_MIN && Number(year) <= YEAR_MAX)) {
    fieldErrors.year = FILM_FORM_MESSAGES.year;
  }

  const parsed = formatSchema.safeParse(values);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && key in values && !fieldErrors[key as FilmFormField]) {
        fieldErrors[key as FilmFormField] = issue.message;
      }
    }
  }

  if (missing.length || Object.keys(fieldErrors).length || !parsed.success) {
    return { data: null, missing, fieldErrors };
  }
  return { data: { ...parsed.data, year: Number(year) }, missing, fieldErrors };
}

export function missingText(missing: readonly RequiredField[]): string {
  return `Заполните обязательные поля: ${missing.map((f) => REQUIRED_LABELS[f]).join(", ")}`;
}

/** FormData из формы → значения полей (на сервере) */
export function filmFormValuesFromFormData(fd: FormData): FilmFormValues {
  const str = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : "";
  };
  const age = str("ageRating");
  return {
    title: str("title"),
    originalTitle: str("originalTitle"),
    year: str("year"),
    durationMin: str("durationMin"),
    // Порядок из формы (первый жанр показывается в карточке), только известные и без повторов
    genres: [...new Set(fd.getAll("genres"))].flatMap((v) => GENRES.filter((g) => g === v)),
    ageRating: AGE_RATINGS.find((a) => a === age) ?? "",
    country: str("country"),
    director: str("director"),
    cast: str("cast"),
    description: str("description"),
    trailerUrl: str("trailerUrl"),
    isNew: str("isNew") === "1",
  };
}

/** Фильм из базы → значения формы редактирования */
export function filmToFormValues(film: Film): FilmFormValues {
  return {
    title: film.title,
    originalTitle: film.originalTitle ?? "",
    year: String(film.year),
    durationMin: film.durationMin === null ? "" : String(film.durationMin),
    genres: [...film.genres],
    ageRating: film.ageRating ?? "",
    country: film.country ?? "",
    director: film.director ?? "",
    cast: film.cast.join(", "),
    description: film.description,
    trailerUrl: film.trailerUrl ?? "",
    isNew: film.isNew,
  };
}
