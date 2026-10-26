import type { NextAuthConfig } from "next-auth";
import { ROLES, type Role } from "@/lib/auth/roles";

function toRole(value: unknown): Role {
  return ROLES.find((r) => r === value) ?? "user";
}

/**
 * Общая часть настроек без провайдеров (без bcrypt и файловой системы):
 * её использует proxy.ts, а полная — src/auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = toRole(token.role);
      return session;
    },
  },
} satisfies NextAuthConfig;
