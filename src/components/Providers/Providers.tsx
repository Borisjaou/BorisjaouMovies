"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider/ThemeProvider";
import { FavoritesProvider } from "@/lib/favorites";
import { WatchListsProvider } from "@/lib/watchlists";

/** Клиентские провайдеры приложения: тема, сессия, избранное, «Надо посмотреть» / «Просмотрено» */
/** session — с сервера: шапка сразу знает, вошёл ли пользователь */
export function Providers({ children, session }: { children: ReactNode; session: Session | null }) {
  return (
    <ThemeProvider>
      <SessionProvider session={session}>
        <FavoritesProvider>
          <WatchListsProvider>{children}</WatchListsProvider>
        </FavoritesProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
