"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Icon, type IconName } from "@/components/icons";
import { cx } from "@/lib/cx";
import { SHELF_ORDER, SHELVES, type ShelfId } from "@/lib/shelves";
import { useShelves } from "@/lib/useShelf";
import styles from "./BottomNav.module.scss";

export type BottomNavItem = "catalog" | "genres" | ShelfId | "profile";

const ITEMS: ReadonlyArray<{ id: BottomNavItem; href: string; label: string; icon: IconName; shelf?: ShelfId }> = [
  { id: "catalog", href: "/", label: "Каталог", icon: "home" },
  { id: "genres", href: "/genres", label: "Жанры", icon: "grid" },
  // «Надо посмотреть», «Просмотрено», «Избранное»
  ...SHELF_ORDER.map((id) => ({ id, href: SHELVES[id].path, label: SHELVES[id].navLabel, icon: SHELVES[id].icon, shelf: id })),
  // Гость — на вход, вошедший — на экран профиля
  { id: "profile", href: "/profile", label: "Профиль", icon: "user" },
];

/** Нижнее меню мобильной раскладки */
export function BottomNav({ active }: { active: BottomNavItem }) {
  const shelves = useShelves();
  const { status } = useSession();
  const hrefOf = (item: (typeof ITEMS)[number]) =>
    item.id === "profile" && status !== "authenticated" ? "/login?callbackUrl=%2Fprofile" : item.href;

  return (
    <nav aria-label="Основная навигация" className={cx(styles.nav, "only-mobile")}>
      {ITEMS.map((item) => {
        const on = item.id === active;
        const list = item.shelf ? shelves[item.shelf] : null;
        return (
          <Link
            key={item.id}
            href={hrefOf(item)}
            aria-current={on ? "page" : undefined}
            className={cx(styles.item, on && styles.on)}
          >
            <span className={styles.icon}>
              {/* Залитая иконка — только у активного раздела-списка (у «Просмотрено» контур) */}
              <Icon name={item.icon} size={22} filled={Boolean(item.shelf) && on && item.id !== "watched"} />
              {list?.ready && <span className={styles.badge}>{list.count}</span>}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
