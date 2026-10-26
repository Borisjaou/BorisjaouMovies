import type { Metadata } from "next";
import { FilmForm } from "@/components/admin/FilmForm";

export const metadata: Metadata = { title: "Новый фильм" };

export default function NewFilmPage() {
  return <FilmForm heading="Новый фильм" />;
}
