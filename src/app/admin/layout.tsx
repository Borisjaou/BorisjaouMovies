import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Вторая проверка роли (первая — в proxy.ts): страницы админки только для admin */
export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/login?callbackUrl=/admin/films");
  if (!viewer.isAdmin) redirect("/");
  return children;
}
