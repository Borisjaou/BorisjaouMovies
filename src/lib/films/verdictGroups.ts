import type { IconName } from "@/components/icons";
import type { Film } from "./types";

export interface VerdictGroup<T> {
  id: "liked" | "disliked" | "none";
  title: string;
  icon: IconName | null;
  films: T[];
}

/** «Просмотрено» по ИМХО: «Понравились», «Не понравились», «Без оценки». Пустые группы не возвращаются, порядок внутри сохраняется. */
export function groupByVerdict<T extends Pick<Film, "verdict">>(films: readonly T[]): VerdictGroup<T>[] {
  const groups: VerdictGroup<T>[] = [
    { id: "liked", title: "Понравились", icon: "thumbUp", films: films.filter((f) => f.verdict === "liked") },
    { id: "disliked", title: "Не понравились", icon: "thumbDown", films: films.filter((f) => f.verdict === "disliked") },
    { id: "none", title: "Без оценки", icon: null, films: films.filter((f) => f.verdict === null) },
  ];
  return groups.filter((g) => g.films.length > 0);
}

/** Раздел «Яма»: фильмы с ИМХО «не понравился» */
export const PIT = {
  title: "Яма",
  emptyTitle: "В яме пока пусто",
  emptyText: "Сюда попадают фильмы с ИМХО «Не понравился»",
} as const;
