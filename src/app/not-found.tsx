import type { Metadata } from "next";
import { NotFoundView } from "@/components/NotFoundView/NotFoundView";

export const metadata: Metadata = { title: "Страница не найдена" };

export default function NotFound() {
  return <NotFoundView title="Страница не найдена" text="Возможно, ссылка устарела или страница удалена" />;
}
