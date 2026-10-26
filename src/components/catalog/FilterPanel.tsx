"use client";

import { Segmented } from "@/components/ui/Segmented";
import { cx } from "@/lib/cx";
import { CATALOG_GENRES, DECADES, RATING_OPTIONS, type DecadeId, type Genre } from "@/lib/films/constants";
import type { CatalogQuery } from "@/lib/films/params";
import styles from "./FilterPanel.module.scss";

interface FilterPanelProps {
  query: CatalogQuery;
  onChange: (patch: Partial<CatalogQuery>) => void;
  className?: string;
}

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/** Панель фильтров слева (DeskCatalog): годы, жанры, рейтинг */
export function FilterPanel({ query, onChange, className }: FilterPanelProps) {
  return (
    <aside aria-label="Фильтры" className={cx(styles.panel, className)}>
      <div className={styles.head}>
        <h2 className={styles.title}>Фильтры</h2>
        <button
          type="button"
          onClick={() => onChange({ genres: [], decades: [], rating: undefined })}
          className={styles.reset}
        >
          Сбросить
        </button>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Годы выпуска</legend>
        {DECADES.map((d) => (
          <label key={d.id} className={styles.check}>
            <input
              type="checkbox"
              checked={query.decades.includes(d.id)}
              onChange={() => onChange({ decades: toggle<DecadeId>(query.decades, d.id) })}
            />
            {d.label}
          </label>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Жанры</legend>
        {CATALOG_GENRES.map((g) => (
          <label key={g} className={styles.check}>
            <input
              type="checkbox"
              checked={query.genres.includes(g)}
              onChange={() => onChange({ genres: toggle<Genre>(query.genres, g) })}
            />
            {g}
          </label>
        ))}
      </fieldset>

      <div className={styles.rating}>
        <div className={styles.legend}>Рейтинг зрителей</div>
        <Segmented
          options={RATING_OPTIONS}
          value={query.rating ?? "any"}
          onChange={(id) => onChange({ rating: id === "any" ? undefined : id })}
          ariaLabel="Минимальный рейтинг"
          compact
          itemHeight={36}
          fontSize={13}
        />
      </div>
    </aside>
  );
}
