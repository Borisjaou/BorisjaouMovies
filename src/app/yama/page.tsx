import type { Metadata } from "next";
import { PitView } from "@/components/pit/PitView";
import { getFilms, MAX_IDS } from "@/lib/films";

export const metadata: Metadata = { title: "Яма", robots: { index: false, follow: true } };

/** «Яма» (мобила): фильмы с ИМХО «не понравился». На ПК — раздел каталога /?yama=1 */
export default async function PitPage() {
  const { items } = await getFilms({ pit: true, sort: "new" }, { pageSize: MAX_IDS });
  return <PitView films={items} />;
}
