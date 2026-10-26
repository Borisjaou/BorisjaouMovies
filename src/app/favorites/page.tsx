import type { Metadata } from "next";
import { FavoritesView } from "@/components/favorites/FavoritesView";

export const metadata: Metadata = { title: "Избранное", robots: { index: false, follow: true } };

export default function FavoritesPage() {
  // Список фильмов грузится на клиенте: у гостя id — в браузере, у пользователя — в базе
  return <FavoritesView />;
}
