"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { cx } from "@/lib/cx";
import type { Film } from "@/lib/films/types";
import { filmPosterVar } from "./poster";
import styles from "./FilmCard.module.scss";
import { PosterImage } from "./PosterImage";

interface FilmCardProps {
  film: Film;
  isFavorite: boolean;
  onToggleFavorite: (film: Film) => void;
  /** Кнопка «Поделиться» — только на ПК (DeskCatalog) */
  onShare: (film: Film) => void;
}

/** Карточка каталога: Catalog (мобила) / DeskCatalog (ПК) */
export function FilmCard({ film, isFavorite, onToggleFavorite, onShare }: FilmCardProps) {
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
          <Icon name="star" size={14} className={styles.star} />
          {film.rating !== null && <span className={styles.rating}>{film.rating.toFixed(1)}</span>}
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
        <button
          type="button"
          onClick={() => onToggleFavorite(film)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
          className={cx(styles.glass, isFavorite && styles.favOn)}
        >
          <Icon name="heart" size={22} filled={isFavorite} />
        </button>
      </div>
    </div>
  );
}
