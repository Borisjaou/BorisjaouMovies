import { filmUrl, SITE_URL } from "@/lib/site";
import type { Film } from "./types";

/** Разметка schema.org/Movie для поисковиков (страница фильма) */
export function filmJsonLd(film: Film): Record<string, unknown> {
  const url = filmUrl(film.slug);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: film.title,
    url,
    description: film.description || film.shortDescription,
    genre: film.genres,
    dateCreated: String(film.year),
    image: film.posterUrl ? new URL(film.posterUrl, SITE_URL).toString() : `${url}/opengraph-image`,
  };
  if (film.originalTitle) data.alternateName = film.originalTitle;
  if (film.durationMin) data.duration = `PT${Math.floor(film.durationMin / 60)}H${film.durationMin % 60}M`;
  if (film.country) data.countryOfOrigin = { "@type": "Country", name: film.country };
  if (film.director) data.director = { "@type": "Person", name: film.director };
  if (film.cast.length) data.actor = film.cast.map((name) => ({ "@type": "Person", name }));
  return data;
}

/** JSON для <script type="application/ld+json">: без «<», чтобы нельзя было закрыть тег из данных */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
