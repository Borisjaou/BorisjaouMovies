import type { Metadata } from "next";
import { FiltersView } from "@/components/filters/FiltersView";
import { parseCatalogQuery, type SearchParamsRecord } from "@/lib/films/params";

export const metadata: Metadata = { title: "Фильтры", robots: { index: false, follow: true } };

export default async function FiltersPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const query = parseCatalogQuery(await searchParams);
  // key: при переходе с другими параметрами черновик собирается заново
  return <FiltersView key={JSON.stringify(query)} query={query} />;
}
