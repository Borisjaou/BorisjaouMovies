export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

/**
 * Администраторы задаются в .env: ADMIN_EMAILS=boss@mail.ru,editor@mail.ru
 * Роль выдаётся при регистрации / первом входе через Google.
 * Регистрация открыта только для этих адресов.
 */
export function isAdminEmail(email: string, list = process.env.ADMIN_EMAILS ?? ""): boolean {
  const target = email.trim().toLowerCase();
  return list
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(target);
}

export function roleForEmail(email: string): Role {
  return isAdminEmail(email) ? "admin" : "user";
}

/** Только относительные пути внутри сайта: защита от открытого редиректа */
export function safeCallbackUrl(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
