import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";
import { roleForEmail } from "@/lib/auth/roles";
import { loginSchema } from "@/lib/auth/schemas";
import { getUserRepository } from "@/lib/users";

export const isGoogleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await getUserRepository().findByEmail(parsed.data.email);
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        return ok ? { id: user.id, email: user.email, name: user.name, role: user.role } : null;
      },
    }),
    ...(isGoogleConfigured ? [Google] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        // Первый вход через Google создаёт пользователя; повторный — привязывает Google к аккаунту
        const repo = getUserRepository();
        const email = profile.email.toLowerCase();
        const existing = await repo.findByEmail(email);
        const record = existing
          ? existing.providers.includes("google")
            ? existing
            : await repo.update(existing.id, { providers: [...existing.providers, "google"] })
          : await repo.create({
              email,
              name: profile.name ?? email,
              passwordHash: null,
              role: roleForEmail(email),
              providers: ["google"],
            });
        token.sub = record.id;
        token.name = record.name;
        token.role = record.role;
      } else if (user) {
        token.role = user.role;
      }
      return token;
    },
  },
});
