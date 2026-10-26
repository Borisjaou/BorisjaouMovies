import { z } from "zod";

/** Тексты ошибок форм входа и регистрации */
export const AUTH_MESSAGES = {
  nameRequired: "Введите имя",
  nameTooLong: "Не больше 60 символов",
  emailRequired: "Введите эл. почту",
  emailInvalid: "Проверьте адрес эл. почты",
  passwordRequired: "Введите пароль",
  passwordShort: "Минимум 8 символов",
  passwordLong: "Не больше 72 символов",
  emailTaken: "Этот адрес уже зарегистрирован",
  wrongCredentials: "Неверная эл. почта или пароль",
  googleNotConfigured: "Вход через Google пока не настроен",
  unknown: "Не получилось войти. Попробуйте ещё раз",
} as const;

const email = z
  .string()
  .trim()
  .min(1, AUTH_MESSAGES.emailRequired)
  .pipe(z.email(AUTH_MESSAGES.emailInvalid))
  .transform((v) => v.toLowerCase());

export const loginSchema = z.object({
  email,
  password: z.string().min(1, AUTH_MESSAGES.passwordRequired),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, AUTH_MESSAGES.nameRequired).max(60, AUTH_MESSAGES.nameTooLong),
  email,
  // bcrypt учитывает только первые 72 байта
  password: z
    .string()
    .min(1, AUTH_MESSAGES.passwordRequired)
    .min(8, AUTH_MESSAGES.passwordShort)
    .max(72, AUTH_MESSAGES.passwordLong),
});

export type LoginInput = z.input<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
