import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import { getViewer } from "@/lib/auth";
import { getFilms, getNewFilms } from "@/lib/films";
import { parseCatalogQuery, toFilmFilters, type SearchParamsRecord } from "@/lib/films/params";
import type { FilmPage } from "@/lib/films/types";

type Props = { searchParams: Promise<SearchParamsRecord> };

/** Главная индексируется; её варианты с поиском, фильтрами и «Избранным» — нет (дубли) */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const hasQuery = Object.keys(await searchParams).length > 0;
  return {
    alternates: { canonical: "/" },
    ...(hasQuery ? { robots: { index: false, follow: true } } : {}),
  };
}

const EMPTY_PAGE: FilmPage = { items: [], total: 0, page: 1, pageSize: 20, hasMore: false };

export default async function CatalogPage({ searchParams }: Props) {
  const query = parseCatalogQuery(await searchParams);
  const [page, freshFilms, viewer] = await Promise.all([
    // В режиме «Избранное» список грузится на клиенте по id из избранного
    query.fav ? Promise.resolve(EMPTY_PAGE) : getFilms(toFilmFilters(query)),
    getNewFilms(),
    getViewer(),
  ]);

  return <CatalogView page={page} freshFilms={freshFilms} query={query} isAdmin={viewer.isAdmin} />;
}
