import type { Metadata } from "next";
import { ShelfView } from "@/components/shelves/ShelfView";

export const metadata: Metadata = { title: "Просмотрено", robots: { index: false, follow: true } };

export default function WatchedPage() {
  // Как «Избранное»: у гостя список в браузере, у пользователя — в базе
  return <ShelfView shelf="watched" />;
}
