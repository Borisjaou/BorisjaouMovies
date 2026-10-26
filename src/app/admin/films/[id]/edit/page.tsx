import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FilmForm } from "@/components/admin/FilmForm";
import { adminFilms } from "@/lib/films/admin";
import { filmToFormValues } from "@/lib/films/filmForm";

export const metadata: Metadata = { title: "Редактирование" };

export default async function EditFilmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const filmId = /^\d+$/.test(id) ? Number(id) : NaN;
  const film = Number.isSafeInteger(filmId) ? await adminFilms.getById(filmId) : null;
  if (!film) notFound();

  return (
    <FilmForm
      key={film.id}
      heading="Редактирование"
      filmId={film.id}
      slug={film.slug}
      initialValues={filmToFormValues(film)}
      initialPosterUrl={film.posterUrl ?? null}
    />
  );
}
