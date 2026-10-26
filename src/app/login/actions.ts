"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { isGoogleConfigured, signIn } from "@/auth";
import { roleForEmail, safeCallbackUrl } from "@/lib/auth/roles";
import { AUTH_MESSAGES, loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/auth/schemas";
import { getUserRepository } from "@/lib/users";

type Field = "name" | "email" | "password";

export type AuthResult =
  | { ok: true; redirectTo: string }
  | { ok: false; formError?: string; fieldErrors?: Partial<Record<Field, string>> };

function fieldErrors(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>): Partial<Record<Field, string>> {
  const out: Partial<Record<Field, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if ((key === "name" || key === "email" || key === "password") && !out[key]) out[key] = issue.message;
  }
  return out;
}

async function signInWithPassword(email: string, password: string, redirectTo: string): Promise<AuthResult> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return { ok: true, redirectTo };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        formError: error.type === "CredentialsSignin" ? AUTH_MESSAGES.wrongCredentials : AUTH_MESSAGES.unknown,
      };
    }
    throw error;
  }
}

export async function loginAction(input: LoginInput, callbackUrl?: string): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error.issues) };
  return signInWithPassword(parsed.data.email, parsed.data.password, safeCallbackUrl(callbackUrl));
}

export async function registerAction(input: RegisterInput, callbackUrl?: string): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error.issues) };

  const { name, email, password } = parsed.data;
  const repo = getUserRepository();
  const existing = await repo.findByEmail(email);
  if (existing) return { ok: false, fieldErrors: { email: AUTH_MESSAGES.emailTaken } };

  try {
    await repo.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: roleForEmail(email),
      providers: ["credentials"],
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_TAKEN") {
      return { ok: false, fieldErrors: { email: AUTH_MESSAGES.emailTaken } };
    }
    throw error;
  }

  return signInWithPassword(email, password, safeCallbackUrl(callbackUrl));
}

/** Google: при успехе signIn делает редирект сам (исключение NEXT_REDIRECT не перехватываем) */
export async function googleAction(callbackUrl?: string): Promise<AuthResult> {
  if (!isGoogleConfigured) return { ok: false, formError: AUTH_MESSAGES.googleNotConfigured };
  await signIn("google", { redirectTo: safeCallbackUrl(callbackUrl) });
  return { ok: true, redirectTo: safeCallbackUrl(callbackUrl) };
}
