import type { MetadataRoute } from "next";
import { getPublishedSlugs } from "@/lib/films";
import { filmUrl, SITE_URL } from "@/lib/site";

// Список фильмов берётся из базы при каждом запросе (не на этапе сборки)
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const films = await getPublishedSlugs();
  const lastFilm = films.reduce<Date | undefined>((max, f) => (!max || f.updatedAt > max ? f.updatedAt : max), undefined);
  return [
    { url: SITE_URL, lastModified: lastFilm, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/genres`, changeFrequency: "monthly", priority: 0.5 },
    ...films.map((f) => ({
      url: filmUrl(f.slug),
      lastModified: f.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
