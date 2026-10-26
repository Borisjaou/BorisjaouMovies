"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createFavoritesRepository, MAX_MERGE } from "@/lib/favorites/repository";
import type { FavoriteEntry } from "@/lib/favorites/types";

const repo = createFavoritesRepository(prisma);

const filmIdSchema = z.number().int().positive();
const entriesSchema = z
  .array(z.object({ filmId: filmIdSchema, addedAt: z.number().finite().nonnegative() }))
  .max(MAX_MERGE);

/** id вошедшего пользователя; сессия без пользователя в базе считается гостевой */
async function requireUserId(): Promise<string> {
  const id = (await auth())?.user?.id;
  if (!id || !(await prisma.user.findUnique({ where: { id }, select: { id: true } }))) {
    throw new Error("UNAUTHORIZED");
  }
  return id;
}

export async function listFavoritesAction(): Promise<FavoriteEntry[]> {
  return repo.list(await requireUserId());
}

export async function addFavoriteAction(filmId: number): Promise<void> {
  await repo.add(await requireUserId(), filmIdSchema.parse(filmId));
}

export async function removeFavoriteAction(filmId: number): Promise<void> {
  await repo.remove(await requireUserId(), filmIdSchema.parse(filmId));
}

/** Перенос гостевого избранного (localStorage) в аккаунт после входа */
export async function mergeFavoritesAction(entries: FavoriteEntry[]): Promise<FavoriteEntry[]> {
  return repo.merge(await requireUserId(), entriesSchema.parse(entries));
}
