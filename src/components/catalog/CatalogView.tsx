"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { FilmCard } from "@/components/films/FilmCard";
import { ImhoSheet } from "@/components/imho/ImhoSheet";
import { FreshCard } from "@/components/films/FreshCard";
import { BottomNav } from "@/components/layout/BottomNav";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { Chip } from "@/components/ui/Chip";
import { Logo } from "@/components/ui/Logo";
import { SearchField } from "@/components/ui/SearchField";
import { Segmented } from "@/components/ui/Segmented";
import { Toast } from "@/components/ui/Toast";
import { cx } from "@/lib/cx";
import { useListFilms } from "@/lib/favorites";
import { CATALOG_GENRES, FILM_LINK_BASE, SORT_OPTIONS, type Genre } from "@/lib/films/constants";
import { catalogHref, shelfOf, stringifyCatalogQuery, withShelf, type CatalogQuery } from "@/lib/films/params";
import type { Film, FilmPage } from "@/lib/films/types";
import { groupByVerdict, PIT } from "@/lib/films/verdictGroups";
import { FILM_FORMS, plural } from "@/lib/plural";
import { SHELVES, shelfToast, type ShelfId } from "@/lib/shelves";
import { useShelves } from "@/lib/useShelf";
import { useToast } from "@/lib/useToast";
import { FilterPanel } from "./FilterPanel";
import { useLoadMore } from "./useLoadMore";
import styles from "./CatalogView.module.scss";

const SEARCH_DELAY_MS = 300;
const PLACEHOLDER = "Фильм, актёр, режиссёр";

interface CatalogViewProps {
  /** Первая страница каталога: отфильтрована и отсортирована на сервере (в режиме раздела-списка не используется) */
  page: FilmPage;
  freshFilms: Film[];
  query: CatalogQuery;
  isAdmin: boolean;
}

export function CatalogView({ page, freshFilms, query, isAdmin }: CatalogViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const shelves = useShelves();
  // Раздел на ПК: «Надо посмотреть» / «Просмотрено» / «Избранное»; null — обычный каталог
  const shelf = shelfOf(query);
  const toast = useToast();

  // ---- URL ----
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const navigate = (next: CatalogQuery) => {
    startTransition(() => router.replace(catalogHref(next), { scroll: false }));
  };
  const update = (patch: Partial<CatalogQuery>) => navigate({ ...queryRef.current, ...patch });

  // ---- Поиск с задержкой 300 мс ----
  const [search, setSearch] = useState(query.q);
  const [urlQ, setUrlQ] = useState(query.q);
  if (query.q !== urlQ) {
    // URL изменился извне (назад/вперёд, сброс) — подтягиваем значение поля
    setUrlQ(query.q);
    if (query.q !== search.trim()) setSearch(query.q);
  }
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const onSearch = (value: string) => {
    setSearch(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => update({ q: value }), SEARCH_DELAY_MS);
  };
  const resetTo = (next: CatalogQuery) => {
    if (timer.current) clearTimeout(timer.current);
    setSearch(next.q);
    navigate(next);
  };

  // ---- Список ----
  // Каталог: первая страница с сервера + подгрузка следующих при прокрутке (по 20)
  const listKey = stringifyCatalogQuery(shelf ? withShelf(query, null) : query);
  const { items: catalogItems, total: catalogTotal, hasMore, attachSentinel } = useLoadMore(page, listKey, shelf === null);
  // Раздел-список (ПК): фильмы из списка с теми же фильтрами и сортировкой
  const shelfApi = shelves[shelf ?? "favorites"];
  const shelfList = useListFilms(shelfApi, listKey, shelf !== null);

  const list = shelf ? (shelfList ?? []) : catalogItems;
  // Пока список не загружен, в режиме раздела не показываем ни фильмы, ни «пусто»
  const pending = shelf !== null && shelfList === null;
  const total = shelf ? list.length : catalogTotal;
  const countLabel = `${total} ${plural(total, FILM_FORMS)}`;

  // Админу после отметки «Просмотрено» — окно «Как вам фильм?» (ИМХО)
  const [imhoFilm, setImhoFilm] = useState<Film | null>(null);
  const closeImho = useCallback(() => setImhoFilm(null), []);
  const toggleShelf = (film: Film, id: ShelfId) => {
    const added = shelves[id].toggle(film.id);
    toast.show(shelfToast(id, film.title, added));
    if (added && id === "watched" && isAdmin) setImhoFilm(film);
  };
  const share = (film: Film) => {
    navigator.clipboard?.writeText(`https://${FILM_LINK_BASE}${film.slug}`).catch(() => undefined);
    toast.show(`Ссылка на «${film.title}» скопирована`);
  };

  // ---- Жанры ----
  const toggleGenre = (g: Genre) =>
    update({ genres: query.genres.includes(g) ? query.genres.filter((x) => x !== g) : [...query.genres, g] });

  const sortIndex = SORT_OPTIONS.findIndex((s) => s.id === query.sort);
  const cycleSort = () => update({ sort: SORT_OPTIONS[(sortIndex + 1) % SORT_OPTIONS.length].id });

  const emptyShelf = shelf !== null && shelfApi.count === 0;
  // «Яма» без поиска и фильтров пуста — особый текст
  const pit = shelf === null && query.pit === true;
  const emptyPit =
    pit && !query.q.trim() && query.genres.length === 0 && query.decades.length === 0 && catalogTotal === 0;
  const sectionTitle = shelf ? SHELVES[shelf].title : pit ? PIT.title : null;
  // «Просмотрено» на ПК делится на группы по ИМХО
  const groups = shelf === "watched" ? groupByVerdict(list) : null;

  const card = (film: Film) => (
    <FilmCard
      key={film.id}
      film={film}
      shelves={{
        watchlist: shelves.watchlist.has(film.id),
        watched: shelves.watched.has(film.id),
        favorites: shelves.favorites.has(film.id),
      }}
      onToggle={toggleShelf}
      onShare={share}
    />
  );
  const filtersHref = `/filters${stringifyCatalogQuery(query) ? `?${stringifyCatalogQuery(query)}` : ""}`;

  const searchField = (id: string, size: "lg" | "md") => (
    <SearchField
      id={id}
      label="Поиск фильмов"
      placeholder={PLACEHOLDER}
      size={size}
      value={search}
      onChange={(e) => onSearch(e.target.value)}
    />
  );

  return (
    <div className={styles.page}>
      {/* ---------- Мобила: шапка (Catalog) ---------- */}
      <header className={cx(styles.mHeader, "only-mobile")}>
        <div className={styles.mTop}>
          <Logo size="mobile" />
          <div className={styles.mTopActions}>
            {isAdmin && (
              <Link href="/admin" className={styles.mAdmin}>
                Админка
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
        <div className={styles.mSearchRow}>
          {searchField("search", "lg")}
          <Link href={filtersHref} aria-label="Фильтры" className={styles.mFilters}>
            <Icon name="sliders" size={22} />
          </Link>
        </div>
      </header>

      {/* ---------- ПК: шапка (DeskCatalog) ---------- */}
      <DesktopHeader
        active={shelf ?? (pit ? "yama" : "catalog")}
        catalogHref={catalogHref(withShelf(query, null))}
        shelfQuery={withShelf(query, null)}
        search={searchField("d-search", "md")}
        isAdmin={isAdmin}
      />

      <div className={styles.layout}>
        <FilterPanel query={query} onChange={update} className="only-desktop" />

        <main className={styles.main}>
          {/* Заголовок страницы для чтения с экрана: в эталоне видимого h1 у каталога нет */}
          <h1 className="visually-hidden">{sectionTitle ?? "Каталог фильмов"}</h1>
          {/* Мобила: жанры одной строкой */}
          <div role="group" aria-label="Жанры" className={cx(styles.mChips, "only-mobile")}>
            <Chip label="Все" on={query.genres.length === 0} onClick={() => update({ genres: [] })} />
            {CATALOG_GENRES.map((g) => (
              <Chip key={g} label={g} on={query.genres.includes(g)} onClick={() => update({ genres: [g] })} />
            ))}
          </div>

          {/* Новинки: на ПК скрыты в режиме раздела-списка */}
          <section className={cx(styles.fresh, sectionTitle && "only-mobile")}>
            <div className={styles.freshHead}>
              <h2 className={styles.freshTitle}>Новинки</h2>
              <a href="#" className={cx(styles.freshAll, "only-mobile")}>
                Все
              </a>
            </div>
            <div className={styles.freshRow}>
              {freshFilms.map((f) => (
                <FreshCard key={f.id} film={f} />
              ))}
            </div>
          </section>

          <section className={styles.catalog}>
            {/* Мобила: заголовок + сортировка по кругу + счётчик */}
            <div className={cx(styles.mCatalogHead, "only-mobile")}>
              <h2 className={styles.mCatalogTitle}>Каталог</h2>
              <button type="button" onClick={cycleSort} className={styles.mSort}>
                {SORT_OPTIONS[sortIndex].label}
                <Icon name="sort" size={16} />
              </button>
            </div>
            <p className={cx(styles.mCount, "only-mobile")}>
              {countLabel}
              {query.genres.length > 0 && ` · ${query.genres.join(", ")}`}
            </p>

            {/* ПК: заголовок + счётчик + сортировка, чипы жанров */}
            <div className={cx(styles.dCatalogHead, "only-desktop")}>
              <div className={styles.dHeading}>
                <h2 className={styles.dCatalogTitle}>{sectionTitle ?? "Каталог"}</h2>
                <span className={styles.dCount}>{pending ? "" : countLabel}</span>
              </div>
              <Segmented
                options={SORT_OPTIONS}
                value={query.sort}
                onChange={(sort) => update({ sort })}
                ariaLabel="Сортировка"
                layout="inline"
                compact
                itemHeight={38}
                fontSize={14}
              />
            </div>
            <div role="group" aria-label="Быстрый выбор жанра" className={cx(styles.dChips, "only-desktop")}>
              <Chip label="Все жанры" on={query.genres.length === 0} onClick={() => update({ genres: [] })} />
              {CATALOG_GENRES.map((g) => (
                <Chip key={g} label={g} on={query.genres.includes(g)} onClick={() => toggleGenre(g)} />
              ))}
            </div>

            {pending ? null : groups && groups.length > 0 ? (
              <div className={styles.groups}>
                {groups.map((g) => (
                  <section key={g.id} aria-labelledby={`group-${g.id}`} className={styles.group}>
                    <h3 id={`group-${g.id}`} className={styles.groupTitle}>
                      {g.icon && <Icon name={g.icon} size={20} />}
                      {g.title}
                      <span className={styles.groupCount}>{g.films.length}</span>
                    </h3>
                    <div className={styles.grid}>{g.films.map(card)}</div>
                  </section>
                ))}
              </div>
            ) : list.length > 0 ? (
              <div className={styles.grid}>
                {list.map(card)}
                {/* Невидимая метка: когда доходит до экрана, подгружается следующая страница */}
                {!shelf && hasMore && <div ref={attachSentinel} aria-hidden="true" />}
              </div>
            ) : (
              <>
                <div className={cx(styles.mEmpty, "only-mobile")}>
                  <div className={styles.mEmptyTitle}>Ничего не нашлось</div>
                  <div className={styles.mEmptyText}>Попробуйте другой запрос или жанр</div>
                  <button
                    type="button"
                    onClick={() => resetTo({ ...query, q: "", genres: [] })}
                    className={styles.mEmptyButton}
                  >
                    Сбросить поиск
                  </button>
                </div>
                <div className={cx(styles.dEmpty, "only-desktop")}>
                  <div className={styles.dEmptyTitle}>{emptyShelf && shelf ? SHELVES[shelf].deskEmptyTitle : emptyPit ? PIT.emptyTitle : "Ничего не нашлось"}</div>
                  <div className={styles.dEmptyText}>
                    {emptyShelf && shelf
                      ? SHELVES[shelf].deskEmptyText
                      : emptyPit
                        ? PIT.emptyText
                        : "Попробуйте изменить запрос или фильтры"}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      resetTo({ q: "", genres: [], decades: [], sort: query.sort, fav: false })
                    }
                    className={styles.dEmptyButton}
                  >
                    Показать все фильмы
                  </button>
                </div>
              </>
            )}
          </section>
        </main>
      </div>

      <BottomNav active="catalog" />
      {imhoFilm && (
        <ImhoSheet
          film={imhoFilm}
          value={{ verdict: imhoFilm.verdict, imho: imhoFilm.imho, imhoAt: imhoFilm.imhoAt }}
          onSaved={() => router.refresh()}
          onClose={closeImho}
        />
      )}
      {/* Тост — только в раскладке ПК, как в DeskCatalog */}
      <div className="only-desktop">
        <Toast message={toast.message} placement="desktop" />
      </div>
    </div>
  );
}
