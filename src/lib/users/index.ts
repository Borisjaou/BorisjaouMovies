import "server-only";
import { prisma } from "@/lib/db";
import { createPrismaUserRepository } from "./prismaRepository";
import type { UserRepository } from "./types";

let repository: UserRepository | null = null;

/** Пользователи в базе (Prisma) */
export function getUserRepository(): UserRepository {
  repository ??= createPrismaUserRepository(prisma);
  return repository;
}

export type { UserRecord, UserRepository, AuthProvider } from "./types";
