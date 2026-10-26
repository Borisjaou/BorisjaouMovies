import type { PrismaClient, User } from "@/generated/prisma/client";
import { ROLES } from "@/lib/auth/roles";
import type { AuthProvider, UserRecord, UserRepository } from "./types";

function toRecord(row: User): UserRecord {
  const providers: AuthProvider[] = [];
  if (row.passwordHash) providers.push("credentials");
  if (row.googleLinked) providers.push("google");
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    role: ROLES.find((r) => r === row.role) ?? "user",
    providers,
    createdAt: row.createdAt.toISOString(),
  };
}

type Patch = Partial<Omit<UserRecord, "id" | "createdAt">>;

function toData(data: Patch) {
  return {
    email: data.email?.toLowerCase(),
    name: data.name,
    passwordHash: data.passwordHash,
    role: data.role,
    googleLinked: data.providers ? data.providers.includes("google") : undefined,
  };
}

export function createPrismaUserRepository(db: PrismaClient): UserRepository {
  return {
    async findByEmail(email) {
      const row = await db.user.findUnique({ where: { email: email.toLowerCase() } });
      return row ? toRecord(row) : null;
    },
    async findById(id) {
      const row = await db.user.findUnique({ where: { id } });
      return row ? toRecord(row) : null;
    },
    async create(data) {
      try {
        const row = await db.user.create({
          data: {
            email: data.email.toLowerCase(),
            name: data.name,
            passwordHash: data.passwordHash,
            role: data.role,
            googleLinked: data.providers.includes("google"),
          },
        });
        return toRecord(row);
      } catch (error) {
        // P2002 — нарушение уникальности email
        if ((error as { code?: string }).code === "P2002") throw new Error("EMAIL_TAKEN");
        throw error;
      }
    },
    async update(id, patch) {
      return toRecord(await db.user.update({ where: { id }, data: toData(patch) }));
    },
  };
}
