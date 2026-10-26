import type { Metadata } from "next";
import { GenresView } from "@/components/genres/GenresView";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Жанры",
  description: "Все жанры каталога Borisjaou: драма, комедия, триллер, фантастика, анимация и другие.",
  alternates: { canonical: "/genres" },
};

export default async function GenresPage() {
  const viewer = await getViewer();
  return <GenresView isAdmin={viewer.isAdmin} />;
}
