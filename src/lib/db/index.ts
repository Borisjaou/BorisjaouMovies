import "server-only";
import { createPrismaClient, type PrismaClient } from "./client";

// Один клиент на процесс; в dev переживает горячую перезагрузку модулей
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
