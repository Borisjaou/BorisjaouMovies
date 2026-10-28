import Form from "next/form";
import { GenreTile } from "@/components/films/GenreTile";
import { BottomNav } from "@/components/layout/BottomNav";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { SearchField } from "@/components/ui/SearchField";
import { cx } from "@/lib/cx";
import { GENRES } from "@/lib/films/constants";
import { catalogHref, EMPTY_QUERY } from "@/lib/films/params";
import { GENRE_FORMS, plural } from "@/lib/plural";
import styles from "./GenresView.module.scss";

/** Жанры: Genres.dc.html (мобила) / DeskGenres.dc.html (ПК) */
export function GenresView({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className={styles.page}>
      <header className={cx(styles.mHeader, "only-mobile")}>
        <h1 className={styles.mTitle}>Жанры</h1>
        <ThemeToggle />
      </header>

      <DesktopHeader
        active="genres"
        catalogHref="/"
        isAdmin={isAdmin}
        search={
          // Поиск на странице жанров открывает каталог с запросом
          <Form action="/" className={styles.searchForm}>
            <SearchField id="g-search" name="q" label="Поиск фильмов" placeholder="Фильм, актёр, режиссёр" size="md" />
          </Form>
        }
      />

      <main className={styles.main}>
        <div className={cx(styles.dHead, "only-desktop")}>
          <h1 className={styles.dTitle}>Жанры</h1>
          <span className={styles.dCount}>
            {GENRES.length} {plural(GENRES.length, GENRE_FORMS)}
          </span>
        </div>
        <div className={styles.grid}>
          {GENRES.map((g, i) => (
            <GenreTile key={g} genre={g} index={i} href={catalogHref({ ...EMPTY_QUERY, genres: [g] })} />
          ))}
        </div>
      </main>

      <BottomNav active="genres" />
    </div>
  );
}
