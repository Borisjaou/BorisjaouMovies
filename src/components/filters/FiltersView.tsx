"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Chip } from "@/components/ui/Chip";
import { Segmented } from "@/components/ui/Segmented";
import {
  COUNTRIES,
  DECADES,
  DURATION_OPTIONS,
  FILTER_GENRES,
  type Country,
  type DecadeId,
  type DurationOptionId,
  type Genre,
} from "@/lib/films/constants";
import { catalogHref, type CatalogQuery } from "@/lib/films/params";
import { useDesktopRedirect } from "@/lib/hooks/useDesktopRedirect";
import { FILTER_FORMS, plural } from "@/lib/plural";
import styles from "./FiltersView.module.scss";

interface Draft {
  decades: DecadeId[];
  genres: Genre[];
  duration: DurationOptionId | null;
  from: string;
  to: string;
  country: Country | "";
}

const EMPTY_DRAFT: Draft = {
  decades: [],
  genres: [],
  duration: null,
  from: "",
  to: "",
  country: "",
};

function fromQuery(q: CatalogQuery): Draft {
  return {
    decades: q.decades,
    genres: q.genres,
    duration: q.duration ?? null,
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
    (draft.duration !== null ? 1 : 0);

  const applyHref = catalogHref({
    ...query,
    decades: draft.decades,
    genres: draft.genres,
    duration: draft.duration ?? undefined,
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
