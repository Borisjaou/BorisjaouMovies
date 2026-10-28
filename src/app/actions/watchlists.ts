"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createWatchListsRepository, MAX_WATCH_MERGE } from "@/lib/watchlists/repository";
import { WATCH_LISTS, type WatchEntry, type WatchListId } from "@/lib/watchlists/types";

const repo = createWatchListsRepository(prisma);

const filmIdSchema = z.number().int().positive();
const listSchema = z.enum(WATCH_LISTS);
const entriesSchema = z
  .array(z.object({ filmId: filmIdSchema, addedAt: z.number().finite().nonnegative(), list: listSchema }))
  .max(MAX_WATCH_MERGE);

/** id вошедшего пользователя; сессия без пользователя в базе считается гостевой */
async function requireUserId(): Promise<string> {
  const id = (await auth())?.user?.id;
  if (!id || !(await prisma.user.findUnique({ where: { id }, select: { id: true } }))) {
    throw new Error("UNAUTHORIZED");
  }
  return id;
}

export async function listWatchListsAction(): Promise<WatchEntry[]> {
  return repo.list(await requireUserId());
}

export async function setWatchListAction(filmId: number, list: WatchListId): Promise<void> {
  await repo.set(await requireUserId(), filmIdSchema.parse(filmId), listSchema.parse(list));
}

export async function removeFromWatchListAction(filmId: number, list: WatchListId): Promise<void> {
  await repo.remove(await requireUserId(), filmIdSchema.parse(filmId), listSchema.parse(list));
}

/** Перенос гостевых списков (localStorage) в аккаунт после входа */
export async function mergeWatchListsAction(entries: WatchEntry[]): Promise<WatchEntry[]> {
  return repo.merge(await requireUserId(), entriesSchema.parse(entries));
}
