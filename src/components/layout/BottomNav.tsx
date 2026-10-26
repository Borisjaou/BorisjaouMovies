"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Icon, type IconName } from "@/components/icons";
import { cx } from "@/lib/cx";
import { useFavorites } from "@/lib/favorites";
import styles from "./BottomNav.module.scss";

export type BottomNavItem = "catalog" | "genres" | "favorites" | "profile";

const ITEMS: ReadonlyArray<{ id: BottomNavItem; href: string; label: string; icon: IconName }> = [
  { id: "catalog", href: "/", label: "Каталог", icon: "home" },
  { id: "genres", href: "/genres", label: "Жанры", icon: "grid" },
  { id: "favorites", href: "/favorites", label: "Избранное", icon: "heart" },
  // Гость — на вход, вошедший — на экран профиля
  { id: "profile", href: "/profile", label: "Профиль", icon: "user" },
];

/** Нижнее меню мобильной раскладки (Catalog / Genres / Favorites) */
export function BottomNav({ active }: { active: BottomNavItem }) {
  const { count, ready } = useFavorites();
  const { status } = useSession();
  const hrefOf = (item: (typeof ITEMS)[number]) =>
    item.id === "profile" && status !== "authenticated" ? "/login?callbackUrl=%2Fprofile" : item.href;

  return (
    <nav aria-label="Основная навигация" className={cx(styles.nav, "only-mobile")}>
      {ITEMS.map((item) => {
        const on = item.id === active;
        return (
          <Link
            key={item.id}
            href={hrefOf(item)}
            aria-current={on ? "page" : undefined}
            className={cx(styles.item, on && styles.on)}
          >
            <span className={styles.icon}>
              {/* Залитое сердце — только у активного «Избранного» */}
              <Icon name={item.icon} size={22} filled={item.id === "favorites" && on} />
              {item.id === "favorites" && ready && <span className={styles.badge}>{count}</span>}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
