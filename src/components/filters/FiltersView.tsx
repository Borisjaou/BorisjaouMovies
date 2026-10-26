"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Chip } from "@/components/ui/Chip";
import { Segmented } from "@/components/ui/Segmented";
import {
  AGE_RATINGS,
  COUNTRIES,
  DECADES,
  DURATION_OPTIONS,
  FILTER_GENRES,
  RATING_OPTIONS,
  type AgeRating,
  type Country,
  type DecadeId,
  type DurationOptionId,
  type Genre,
  type RatingOptionId,
} from "@/lib/films/constants";
import { catalogHref, type CatalogQuery } from "@/lib/films/params";
import { useDesktopRedirect } from "@/lib/hooks/useDesktopRedirect";
import { FILTER_FORMS, plural } from "@/lib/plural";
import styles from "./FiltersView.module.scss";

interface Draft {
  decades: DecadeId[];
  genres: Genre[];
  /** null — ничего не выбрано (повторный клик по активному), "any" — «Любой» */
  rating: RatingOptionId | null;
  duration: DurationOptionId | null;
  ages: AgeRating[];
  from: string;
  to: string;
  country: Country | "";
}

const EMPTY_DRAFT: Draft = {
  decades: [],
  genres: [],
  rating: "any",
  duration: null,
  ages: [],
  from: "",
  to: "",
  country: "",
};

function fromQuery(q: CatalogQuery): Draft {
  return {
    decades: q.decades,
    genres: q.genres,
    rating: q.rating ?? "any",
    duration: q.duration ?? null,
    ages: q.ages,
    from: q.yearFrom !== undefined ? String(q.yearFrom) : "",
    to: q.yearTo !== undefined ? String(q.yearTo) : "",
    country: q.country ?? "",
  };
}

function year(value: string): number | undefined {
  return /^\d{4}$/.test(value) ? Number(value) : undefined;
}

/** /filters?… → /?… */
function toCatalog(search: string): string {
  return `/${search}`;
}

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/** Фильтры (Filters.dc.html). На ≥1024px — редирект на каталог, там панель слева. */
export function FiltersView({ query }: { query: CatalogQuery }) {
  const [draft, setDraft] = useState<Draft>(() => fromQuery(query));
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  useDesktopRedirect(toCatalog);

  const count =
    draft.decades.length +
    draft.genres.length +
    draft.ages.length +
    (draft.rating !== null && draft.rating !== "any" ? 1 : 0) +
    (draft.duration !== null ? 1 : 0);

  const applyHref = catalogHref({
    ...query,
    decades: draft.decades,
    genres: draft.genres,
    rating: draft.rating === null || draft.rating === "any" ? undefined : draft.rating,
    duration: draft.duration ?? undefined,
    ages: draft.ages,
    yearFrom: year(draft.from),
    yearTo: year(draft.to),
    country: draft.country || undefined,
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={catalogHref(query)} aria-label="Закрыть фильтры" className={styles.close}>
          <Icon name="close" size={20} />
        </Link>
        <h1 className={styles.title}>Фильтры</h1>
        <button type="button" onClick={() => setDraft(EMPTY_DRAFT)} className={styles.reset}>
          Сбросить
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <h2 className={styles.h2}>Годы выпуска</h2>
          <div className={styles.years}>
            <div className={styles.field}>
              <label htmlFor="year-from" className={styles.label}>
                С
              </label>
              <input
                id="year-from"
                type="number"
                inputMode="numeric"
                min={1920}
                max={2026}
                value={draft.from}
                onChange={(e) => set({ from: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="year-to" className={styles.label}>
                По
              </label>
              <input
                id="year-to"
                type="number"
                inputMode="numeric"
                min={1920}
                max={2026}
                value={draft.to}
                onChange={(e) => set({ to: e.target.value })}
                className={styles.input}
              />
            </div>
          </div>
          <div className={styles.chips}>
            {DECADES.map((d) => (
              <Chip
                key={d.id}
                size="sm"
                label={d.label}
                on={draft.decades.includes(d.id)}
                onClick={() => set({ decades: toggle(draft.decades, d.id) })}
              />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Жанры</h2>
          <div className={styles.chips}>
            {FILTER_GENRES.map((g) => (
              <Chip
                key={g}
                size="sm"
                check
                label={g}
                on={draft.genres.includes(g)}
                onClick={() => set({ genres: toggle(draft.genres, g) })}
              />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Рейтинг зрителей</h2>
          <Segmented
            options={RATING_OPTIONS}
            value={draft.rating}
            onChange={(id) => set({ rating: draft.rating === id ? null : id })}
            ariaLabel="Минимальный рейтинг"
            itemHeight={42}
            fontSize={14}
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Длительность</h2>
          <Segmented
            options={DURATION_OPTIONS}
            value={draft.duration}
            onChange={(id) => set({ duration: draft.duration === id ? null : id })}
            ariaLabel="Длительность"
            itemHeight={42}
            fontSize={14}
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Возрастной рейтинг</h2>
          <div className={styles.chips}>
            {AGE_RATINGS.map((a) => (
              <Chip
                key={a}
                size="age"
                label={a}
                on={draft.ages.includes(a)}
                onClick={() => set({ ages: toggle(draft.ages, a) })}
              />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <label htmlFor="country" className={styles.countryLabel}>
            Страна
          </label>
          <select
            id="country"
            value={draft.country}
            onChange={(e) => set({ country: COUNTRIES.find((c) => c === e.target.value) ?? "" })}
            className={styles.input}
          >
            <option value="">Все страны</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </section>
      </main>

      <footer className={styles.footer}>
        <Link href={applyHref} className={styles.apply}>
          Показать фильмы
        </Link>
        <div className={styles.active}>
          {count ? `Выбрано: ${count} ${plural(count, FILTER_FORMS)}` : "Фильтры не выбраны"}
        </div>
      </footer>
    </div>
  );
}
