"use client";

import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { filmPosterVar } from "@/components/films/poster";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { cx } from "@/lib/cx";
import { useFavorites } from "@/lib/favorites";
import { SHELVES } from "@/lib/shelves";
import { useWatchList, type WatchListId } from "@/lib/watchlists";
import { filmMeta, formatDuration } from "@/lib/films/format";
import type { Film } from "@/lib/films/types";
import { filmPath } from "@/lib/site";
import { ShareDialog } from "./ShareDialog";
import styles from "./FilmView.module.scss";
import { AccountActions } from "@/components/account/AccountActions";
import { PosterImage } from "@/components/films/PosterImage";

interface FilmViewProps {
  film: Film;
  similar: Film[];
}

/** Страница фильма: Movie.dc.html (до 1023px) / DeskMovie.dc.html (с 1024px) */
export function FilmView({ film, similar }: FilmViewProps) {
  const favorites = useFavorites();
  const fav = favorites.has(film.id);
  const [shareOpen, setShareOpen] = useState(false);
  const closeShare = useCallback(() => setShareOpen(false), []);

  const favLabel = fav ? "Убрать из избранного" : "Добавить в избранное";
  const toggleFav = () => favorites.toggle(film.id);
  const openShare = () => setShareOpen(true);

  // «Надо посмотреть» / «Просмотрено»: фильм может быть только в одном из них
  const watchlist = useWatchList("watchlist");
  const watched = useWatchList("watched");
  const lists: ReadonlyArray<{ id: WatchListId; on: boolean; toggle: () => void }> = [
    { id: "watchlist", on: watchlist.has(film.id), toggle: () => watchlist.toggle(film.id) },
    { id: "watched", on: watched.has(film.id), toggle: () => watched.toggle(film.id) },
  ];
  const listIcon = (id: WatchListId, on: boolean, size: number) => (
    <Icon name={SHELVES[id].icon} size={size} filled={on && id !== "watched"} className={cx(on && styles.listOn)} />
  );

  const tags = (
    <div className={styles.tags}>
      <span className={styles.tag}>{film.year}</span>
      {film.genres.map((g) => (
        <span key={g} className={styles.tag}>
          {g}
        </span>
      ))}
      {film.durationMin !== null && <span className={styles.tag}>{formatDuration(film.durationMin)}</span>}
    </div>
  );

  const crew: ReadonlyArray<{ label: string; value: string }> = [
    film.director ? { label: "Режиссёр", value: film.director } : null,
    film.cast.length ? { label: "В ролях", value: film.cast.join(", ") } : null,
    film.country ? { label: "Страна", value: film.country } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  const trailer = (className: string, iconGap: ReactNode) =>
    film.trailerUrl ? (
      <a href={film.trailerUrl} target="_blank" rel="noopener noreferrer" className={className}>
        {iconGap}
      </a>
    ) : (
      <button type="button" disabled className={className}>
        {iconGap}
      </button>
    );

  const poster = filmPosterVar(film.posterColor);

  return (
    <div className={styles.page}>
      {/* ================= Мобила (Movie.dc.html) ================= */}
      <main className={cx(styles.m, "only-mobile")}>
        <div className={styles.mTopBar}>
          <Link href="/" aria-label="Назад к каталогу" className={styles.glassButton}>
            <Icon name="back" size={22} />
          </Link>
          <ThemeToggle variant="glass" />
        </div>

        <div className={styles.mHero} style={{ background: poster }}>
          <div aria-hidden="true" className={styles.mHeroCircle} />
          <div aria-hidden="true" className={styles.mHeroArch} />
          <div className={styles.mHeroTitle}>{film.title}</div>
          <PosterImage url={film.posterUrl} />
        </div>

        <div className={styles.mSheet}>
          <div className={styles.mIntro}>
            <h1 className={styles.mTitle}>{film.title}</h1>
            {tags}
          </div>

          <div className={styles.mActions}>
            {trailer(
              styles.mTrailer,
              <>
                <Icon name="play" size={18} />
                Смотреть трейлер
              </>,
            )}
            <button
              type="button"
              onClick={toggleFav}
              aria-pressed={fav}
              aria-label={favLabel}
              className={cx(styles.mSquare, fav && styles.heartOn)}
            >
              <Icon name="heart" size={24} filled={fav} />
            </button>
            <button type="button" onClick={openShare} aria-label="Поделиться ссылкой на фильм" className={styles.mSquare}>
              <Icon name="share" size={22} />
            </button>
          </div>

          <div className={styles.mLists}>
            {lists.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={l.toggle}
                aria-pressed={l.on}
                aria-label={l.on ? SHELVES[l.id].removeLabel : SHELVES[l.id].addLabel}
                className={styles.mList}
              >
                {listIcon(l.id, l.on, 20)}
                {l.on ? SHELVES[l.id].buttonOn : SHELVES[l.id].buttonOff}
              </button>
            ))}
          </div>

          {fav && (
            <div role="status" className={styles.mFavStatus}>
              <Icon name="check" size={18} strokeWidth={2.2} />
              Фильм в избранном
              <Link href="/favorites" className={styles.mFavOpen}>
                Открыть
              </Link>
            </div>
          )}

          {film.description && (
            <section className={styles.mSection}>
              <h2 className={styles.mH2}>О фильме</h2>
              <p className={styles.mText}>{film.description}</p>
            </section>
          )}

          {crew.length > 0 && (
            <section className={cx(styles.mSection, styles.mCrewSection)}>
              <h2 className={styles.mH2}>Съёмочная группа</h2>
              <div className={styles.mCrew}>
                {crew.map((row) => (
                  <div key={row.label} className={styles.mCrewRow}>
                    <span className={styles.muted}>{row.label}</span>
                    <span className={styles.mCrewValue}>{row.value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ================= ПК (DeskMovie.dc.html) ================= */}
      <div className={cx(styles.d, "only-desktop")}>
        <header className={styles.dHeader}>
          <div className={styles.dHeaderInner}>
            <Logo size="desktop" href="/" />
            <Link href="/" className={styles.dBack}>
              <Icon name="back" size={18} />
              Каталог
            </Link>
            <div className={styles.dHeaderActions}>
              <ThemeToggle />
              <AccountActions />
            </div>
          </div>
        </header>

        <main className={styles.dContent}>
          <div className={styles.dTop}>
            <div className={styles.dPoster} style={{ background: poster }}>
              <div aria-hidden="true" className={styles.dPosterCircle} />
              <div aria-hidden="true" className={styles.dPosterArch} />
              <div className={styles.dPosterTitle}>{film.title}</div>
              <PosterImage url={film.posterUrl} />
            </div>

            <div className={styles.dInfo}>
              <div className={styles.dIntro}>
                <h1 className={styles.dTitle}>{film.title}</h1>
                {tags}
              </div>

              {film.description && (
                <section className={styles.dAbout}>
                  <h2 className={styles.dH2}>О фильме</h2>
                  <p className={styles.dText}>{film.description}</p>
                </section>
              )}

              <div className={styles.dActions}>
                {trailer(
                  styles.dTrailer,
                  <>
                    <Icon name="play" size={18} />
                    Смотреть трейлер
                  </>,
                )}
                {lists.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={l.toggle}
                    aria-pressed={l.on}
                    aria-label={l.on ? SHELVES[l.id].removeLabel : SHELVES[l.id].addLabel}
                    className={styles.dButton}
                  >
                    {listIcon(l.id, l.on, 22)}
                    {l.on ? SHELVES[l.id].buttonOn : SHELVES[l.id].buttonOff}
                  </button>
                ))}
                <button type="button" onClick={toggleFav} aria-pressed={fav} className={styles.dButton}>
                  <Icon name="heart" size={22} filled={fav} className={cx(fav && styles.heartOn)} />
                  {fav ? "В избранном" : "В избранное"}
                </button>
                <button type="button" onClick={openShare} className={styles.dButton}>
                  <Icon name="share" size={20} />
                  Поделиться
                </button>
              </div>

              {crew.length > 0 && (
                <dl className={styles.dCrew}>
                  {crew.map((row) => (
                    <div key={row.label} className={styles.dCrewRow}>
                      <dt className={styles.muted}>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>

          {similar.length > 0 && (
            <section className={styles.dSimilar}>
              <h2 className={styles.dSimilarTitle}>Похожие фильмы</h2>
              <div className={styles.dSimilarGrid}>
                {similar.map((f) => (
                  <Link key={f.id} href={filmPath(f.slug)} className={styles.dSimilarCard}>
                    <div className={styles.dSimilarPoster} style={{ background: filmPosterVar(f.posterColor) }}>
                      <div aria-hidden="true" className={styles.dSimilarShape} />
                      <div className={styles.dSimilarName}>{f.title}</div>
                      <PosterImage url={f.posterUrl} />
                    </div>
                    <div className={styles.dSimilarMeta}>{filmMeta(f)}</div>
                    <p className={styles.dSimilarDesc}>{f.shortDescription}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {shareOpen && <ShareDialog film={film} onClose={closeShare} />}
    </div>
  );
}
