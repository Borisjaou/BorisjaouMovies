import "server-only";
import { prisma } from "@/lib/db";
import { createAdminFilmsRepository } from "./adminRepository";

/** Фильмы для админки (включая черновики) */
export const adminFilms = createAdminFilmsRepository(prisma);
