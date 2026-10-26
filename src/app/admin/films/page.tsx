import type { Metadata } from "next";
import { AdminFilmsView } from "@/components/admin/AdminFilmsView";
import { adminFilms } from "@/lib/films/admin";

export const metadata: Metadata = { title: "Админка — фильмы" };

export default async function AdminFilmsPage() {
  const films = await adminFilms.listAll();
  return (
    <AdminFilmsView
      films={films.map(({ id, title, year, genres, status, posterColor, posterUrl }) => ({
        id,
        title,
        year,
        genres,
        status,
        posterColor,
        posterUrl,
      }))}
    />
  );
}
