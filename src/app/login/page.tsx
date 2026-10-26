import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthView } from "@/components/auth/AuthView";
import { safeCallbackUrl } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Вход", robots: { index: false, follow: true } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).callbackUrl;
  const callbackUrl = safeCallbackUrl(Array.isArray(raw) ? raw[0] : raw);

  // Уже вошли — отправляем туда, куда шли
  if (await auth()) redirect(callbackUrl);

  return <AuthView callbackUrl={callbackUrl} />;
}
