"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { filmPosterVar } from "@/components/films/poster";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { Segmented } from "@/components/ui/Segmented";
import { Toast } from "@/components/ui/Toast";
import { FAVORITE_SORTS, favoriteFilms, useListFilms, type FavoriteSortId } from "@/lib/favorites";
import type { Film } from "@/lib/films/types";
import { useDesktopRedirect } from "@/lib/hooks/useDesktopRedirect";
import { filmPath, filmUrl } from "@/lib/site";
import { catalogHref, EMPTY_QUERY, withShelf } from "@/lib/films/params";
import { SHELVES, shelfToast, type ShelfId } from "@/lib/shelves";
import { useShelf } from "@/lib/useShelf";
import { useToast } from "@/lib/useToast";
import { groupByVerdict } from "@/lib/films/verdictGroups";
import styles from "./ShelfView.module.scss";
import { PosterImage } from "@/components/films/PosterImage";

/** /favorites, /watchlist, /watched → тот же раздел в каталоге на ПК */
const DESKTOP_HREF: Record<ShelfId, () => string> = {
  favorites: () => catalogHref(withShelf(EMPTY_QUERY, "favorites")),
  watchlist: () => catalogHref(withShelf(EMPTY_QUERY, "watchlist")),
  watched: () => catalogHref(withShelf(EMPTY_QUERY, "watched")),
};

/**
 * Раздел-список: Избранное (Favorites.dc.html) и по его образцу «Надо посмотреть» / «Просмотрено».
 * Только мобильная раскладка, до 1023px.
 */
export function ShelfView({ shelf }: { shelf: ShelfId }) {
  useDesktopRedirect(DESKTOP_HREF[shelf]);
  const info = SHELVES[shelf];
  const list = useShelf(shelf);
  const toast = useToast();
  const [sort, setSort] = useState<FavoriteSortId>("recent");

  const films = useListFilms(list, "");
  const loaded = films !== null;
  const items = favoriteFilms(films ?? [], list.entries, sort);
  const hasItems = items.length > 0;
  const empty = loaded && !hasItems;
  // «Просмотрено» — группами по ИМХО: «Понравились», «Не понравились», «Без оценки»
  const groups = shelf === "watched" ? groupByVerdict(items) : null;

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
    list.remove(film.id);
    toast.show(shelfToast(shelf, film.title, false));
  };

  const item = (film: Film) => (
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
            aria-label={`${info.removeLabel}: ${film.title}`}
            className={`${styles.action} ${shelf === "favorites" ? styles.heart : styles.listOn}`}
          >
            <Icon name={info.icon} size={22} filled={shelf !== "watched"} />
          </button>
        </div>
      </div>
      {/* «Просмотрено»: ИМХО автора под фильмом */}
      {shelf === "watched" && film.imho && <p className={styles.note}>{film.imho}</p>}
    </li>
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.top}>
          <div className={styles.heading}>
            <h1 className={styles.title}>{info.title}</h1>
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
        {hasItems &&
          (groups ? (
            groups.map((g) => (
              <section key={g.id} aria-labelledby={`m-group-${g.id}`} className={styles.group}>
                <h2 id={`m-group-${g.id}`} className={styles.groupTitle}>
                  {g.icon && <Icon name={g.icon} size={20} />}
                  {g.title}
                  <span className={styles.groupCount}>{g.films.length}</span>
                </h2>
                <ul className={styles.list}>{g.films.map(item)}</ul>
              </section>
            ))
          ) : (
            <ul className={styles.list}>{items.map(item)}</ul>
          ))}

        {empty && (
          <div className={styles.empty}>
            <div aria-hidden="true" className={styles.emptyIcon}>
              <Icon name={info.icon} size={40} strokeWidth={1.6} />
            </div>
            <div className={styles.emptyTitle}>{info.emptyTitle}</div>
            <div className={styles.emptyText}>{info.emptyText}</div>
            <Link href="/" className={styles.emptyButton}>
              Перейти в каталог
            </Link>
          </div>
        )}
      </main>

      <Toast message={toast.message} placement="mobile" />
      <BottomNav active={shelf} />
    </div>
  );
}
