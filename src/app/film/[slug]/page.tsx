import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FilmView } from "@/components/film/FilmView";
import { getSimilarFilms } from "@/lib/films";
import { filmJsonLd, serializeJsonLd } from "@/lib/films/jsonLd";
import { filmPath } from "@/lib/site";
import { loadFilm } from "./data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const film = await loadFilm((await params).slug);
  if (!film) notFound();

  const description = film.shortDescription || film.description;
  return {
    title: film.title,
    description,
    alternates: { canonical: filmPath(film.slug) },
    openGraph: {
      type: "video.movie",
      title: film.title,
      description,
      url: filmPath(film.slug),
      siteName: "Borisjaou",
      locale: "ru_RU",
    },
    twitter: { card: "summary_large_image", title: film.title, description },
  };
}

export default async function FilmPage({ params }: Props) {
  const film = await loadFilm((await params).slug);
  if (!film) notFound();

  const similar = await getSimilarFilms(film);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(filmJsonLd(film)) }} />
      <FilmView film={film} similar={similar} />
    </>
  );
}
