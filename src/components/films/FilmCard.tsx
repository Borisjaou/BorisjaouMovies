"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { cx } from "@/lib/cx";
import type { Film } from "@/lib/films/types";
import { SHELF_ORDER, SHELVES, type ShelfId } from "@/lib/shelves";
import { filmPosterVar } from "./poster";
import styles from "./FilmCard.module.scss";
import { PosterImage } from "./PosterImage";

interface FilmCardProps {
  film: Film;
  /** В каких списках фильм: «Надо посмотреть», «Просмотрено», «Избранное» */
  shelves: Record<ShelfId, boolean>;
  onToggle: (film: Film, shelf: ShelfId) => void;
  /** Кнопка «Поделиться» — только на ПК (DeskCatalog) */
  onShare: (film: Film) => void;
}

/** Карточка каталога: Catalog (мобила) / DeskCatalog (ПК) */
export function FilmCard({ film, shelves, onToggle, onShare }: FilmCardProps) {
  const genre = film.genres[0];

  return (
    <div className={styles.card}>
      <Link href={`/film/${film.slug}`} className={styles.link}>
        <div className={styles.poster} style={{ background: filmPosterVar(film.posterColor) }}>
          <div aria-hidden="true" className={cx(styles.shape, styles[`shape${film.posterShape}`])} />
          <div className={styles.title}>{film.title}</div>
          <PosterImage url={film.posterUrl} />
        </div>
        <div className={styles.meta}>
          <span>
            {film.year} · {genre}
          </span>
        </div>
        <p className={styles.desc}>{film.shortDescription}</p>
      </Link>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => onShare(film)}
          aria-label={`Скопировать ссылку: ${film.title}`}
          className={cx(styles.glass, styles.share)}
        >
          <Icon name="share" size={20} />
        </button>
        {SHELF_ORDER.map((id) => {
          const on = shelves[id];
          const info = SHELVES[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(film, id)}
              aria-pressed={on}
              aria-label={on ? info.removeLabel : info.addLabel}
              className={cx(styles.glass, on && (id === "favorites" ? styles.favOn : styles.listOn))}
            >
              {/* У «Просмотрено» контур с галочкой: включённое состояние — цветом */}
              <Icon name={info.icon} size={id === "favorites" ? 22 : 20} filled={on && id !== "watched"} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
