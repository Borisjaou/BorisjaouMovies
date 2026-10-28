"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { filmPosterVar } from "@/components/films/poster";
import { PosterImage } from "@/components/films/PosterImage";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { catalogHref, EMPTY_QUERY, withPit } from "@/lib/films/params";
import type { Film } from "@/lib/films/types";
import { PIT } from "@/lib/films/verdictGroups";
import { useDesktopRedirect } from "@/lib/hooks/useDesktopRedirect";
import { filmPath } from "@/lib/site";
import styles from "@/components/shelves/ShelfView.module.scss";

const toDesktop = () => catalogHref(withPit(EMPTY_QUERY));

/** «Яма»: фильмы с ИМХО «не понравился», с комментарием автора. Мобильная раскладка, по образцу «Избранного». */
export function PitView({ films }: { films: Film[] }) {
  useDesktopRedirect(toDesktop);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.top}>
          <div className={styles.heading}>
            <h1 className={styles.title}>{PIT.title}</h1>
            <span className={styles.count}>{films.length}</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className={styles.main}>
        {films.length > 0 ? (
          <ul className={styles.list}>
            {films.map((film) => (
              <li key={film.id} className={styles.item}>
                <div className={styles.itemRow}>
                  <Link href={filmPath(film.slug)} className={styles.link}>
                    <div className={styles.poster} style={{ background: filmPosterVar(film.posterColor) }}>
                      <div aria-hidden="true" className={styles.posterShape} />
                      <PosterImage url={film.posterUrl} />
                    </div>
                    <div className={styles.text}>
                      <div className={styles.name}>{film.title}</div>
                      <div className={styles.meta}>
                        {film.year} · {film.genres[0]}
                      </div>
                    </div>
                  </Link>
                </div>
                {film.imho && <p className={styles.note}>{film.imho}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <div aria-hidden="true" className={styles.emptyIcon}>
              <Icon name="pit" size={40} strokeWidth={1.6} />
            </div>
            <div className={styles.emptyTitle}>{PIT.emptyTitle}</div>
            <div className={styles.emptyText}>{PIT.emptyText}</div>
            <Link href="/" className={styles.emptyButton}>
              Перейти в каталог
            </Link>
          </div>
        )}
      </main>

      <BottomNav active="yama" />
    </div>
  );
}
