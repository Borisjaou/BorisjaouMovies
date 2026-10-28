import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthView } from "@/components/auth/AuthView";
import { safeCallbackUrl } from "@/lib/auth/roles";
import { AUTH_MESSAGES } from "@/lib/auth/schemas";

export const metadata: Metadata = { title: "Вход", robots: { index: false, follow: true } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const callbackUrl = safeCallbackUrl(first(sp.callbackUrl));
  // Регистрация закрыта: форма создания аккаунта — только по прямой ссылке (для ADMIN_EMAILS)
  const mode = first(sp.mode) === "register" ? "register" : "login";
  // Auth.js возвращает сюда с ?error=AccessDenied, если Google-вход отклонён (новый пользователь)
  const error = first(sp.error);
  const initialError = error === "AccessDenied" ? AUTH_MESSAGES.registrationClosed : error ? AUTH_MESSAGES.unknown : null;

  // Уже вошли — отправляем туда, куда шли
  if (await auth()) redirect(callbackUrl);

  return <AuthView callbackUrl={callbackUrl} mode={mode} initialError={initialError} />;
}
