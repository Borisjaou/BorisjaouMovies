"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { filmPosterVar } from "@/components/films/poster";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { Segmented } from "@/components/ui/Segmented";
import { Toast } from "@/components/ui/Toast";
import { FAVORITE_SORTS, favoriteFilms, useFavoriteFilms, useFavorites, type FavoriteSortId } from "@/lib/favorites";
import { formatRating } from "@/lib/films/format";
import type { Film } from "@/lib/films/types";
import { useDesktopRedirect } from "@/lib/hooks/useDesktopRedirect";
import { filmPath, filmUrl } from "@/lib/site";
import { useToast } from "@/lib/useToast";
import styles from "./FavoritesView.module.scss";
import { PosterImage } from "@/components/films/PosterImage";

/** /favorites → режим «Избранное» в каталоге на ПК */
function toCatalogFavorites(): string {
  return "/?fav=1";
}

/** Избранное: Favorites.dc.html (только мобильная раскладка, до 1023px) */
export function FavoritesView() {
  useDesktopRedirect(toCatalogFavorites);
  const favorites = useFavorites();
  const toast = useToast();
  const [sort, setSort] = useState<FavoriteSortId>("recent");

  const films = useFavoriteFilms("");
  const loaded = films !== null;
  const items = favoriteFilms(films ?? [], favorites.entries, sort);
  const hasItems = items.length > 0;
  const empty = loaded && !hasItems;

  const share = async (film: Film) => {
    const url = filmUrl(film.slug);
    try {
      if (typeof navigator.share === "function") await navigator.share({ title: film.title, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // меню закрыто или буфер недоступен
    }
    toast.show(`Ссылка на «${film.title}» скопирована`);
  };

  const remove = (film: Film) => {
    favorites.remove(film.id);
    toast.show(`«${film.title}» убран из избранного`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.top}>
          <div className={styles.heading}>
            <h1 className={styles.title}>Избранное</h1>
            {loaded && <span className={styles.count}>{items.length}</span>}
          </div>
          <ThemeToggle />
        </div>
        {hasItems && (
          <Segmented
            options={FAVORITE_SORTS}
            value={sort}
            onChange={setSort}
            ariaLabel="Сортировка"
            itemHeight={40}
            fontSize={13}
          />
        )}
      </header>

      <main className={styles.main}>
        {hasItems && (
          <ul className={styles.list}>
            {items.map((film) => (
              <li key={film.id} className={styles.item}>
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
                    {film.rating !== null && (
                      <div className={styles.rating}>
                        <Icon name="star" size={14} className={styles.star} />
                        {formatRating(film.rating)}
                      </div>
                    )}
                  </div>
                </Link>
                <div className={styles.actions}>
                  <button
                    type="button"
                    onClick={() => share(film)}
                    aria-label={`Поделиться: ${film.title}`}
                    className={styles.action}
                  >
                    <Icon name="share" size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(film)}
                    aria-label={`Убрать из избранного: ${film.title}`}
                    className={`${styles.action} ${styles.heart}`}
                  >
                    <Icon name="heart" size={22} filled />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {empty && (
          <div className={styles.empty}>
            <div aria-hidden="true" className={styles.emptyIcon}>
              <Icon name="heart" size={40} strokeWidth={1.6} />
            </div>
            <div className={styles.emptyTitle}>Здесь пока пусто</div>
            <div className={styles.emptyText}>Нажмите на сердечко у фильма, чтобы сохранить его сюда</div>
            <Link href="/" className={styles.emptyButton}>
              Перейти в каталог
            </Link>
          </div>
        )}
      </main>

      <Toast message={toast.message} placement="mobile" />
      <BottomNav active="favorites" />
    </div>
  );
}
