"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { cx } from "@/lib/cx";
import { PIT } from "@/lib/films/verdictGroups";
import { useDismiss } from "@/lib/hooks/useDismiss";
import { SHELVES, type ShelfId } from "@/lib/shelves";
import { useShelves } from "@/lib/useShelf";
import styles from "./BottomNav.module.scss";

export type BottomNavItem = "catalog" | "genres" | ShelfId | "yama" | "profile";

type Item = { id: BottomNavItem; href: string; label: string; icon: IconName; shelf?: ShelfId };

/** Каталог, Надо посмотреть, Избранное, «Ещё», Профиль */
const MAIN: readonly Item[] = [
  { id: "catalog", href: "/", label: "Каталог", icon: "home" },
  { id: "watchlist", href: SHELVES.watchlist.path, label: SHELVES.watchlist.navLabel, icon: "bookmark", shelf: "watchlist" },
  { id: "favorites", href: SHELVES.favorites.path, label: SHELVES.favorites.navLabel, icon: "heart", shelf: "favorites" },
];

/** В меню «Ещё» */
const MORE: readonly Item[] = [
  { id: "genres", href: "/genres", label: "Жанры", icon: "grid" },
  { id: "watched", href: SHELVES.watched.path, label: SHELVES.watched.title, icon: "watched", shelf: "watched" },
  { id: "yama", href: "/yama", label: PIT.title, icon: "pit" },
];

/** Нижнее меню мобильной раскладки */
export function BottomNav({ active }: { active: BottomNavItem }) {
  const shelves = useShelves();
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useDismiss(open, close, rootRef, buttonRef);

  const moreActive = MORE.some((m) => m.id === active);
  const profileHref = status === "authenticated" ? "/profile" : "/login?callbackUrl=%2Fprofile";
  const badge = (shelf?: ShelfId) =>
    shelf && shelves[shelf].ready && <span className={styles.badge}>{shelves[shelf].count}</span>;

  const link = (item: Item) => {
    const on = item.id === active;
    return (
      <Link
        key={item.id}
        href={item.href}
        aria-current={on ? "page" : undefined}
        className={cx(styles.item, on && styles.on)}
      >
        <span className={styles.icon}>
          {/* Залитая иконка — только у активного раздела-списка */}
          <Icon name={item.icon} size={22} filled={Boolean(item.shelf) && on} />
          {badge(item.shelf)}
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    <div ref={rootRef} className={cx(styles.root, "only-mobile")}>
      {open && (
        <ul id="m-more" className={styles.menu}>
          {MORE.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={close}
                aria-current={item.id === active ? "page" : undefined}
                className={cx(styles.menuItem, item.id === active && styles.menuOn)}
              >
                <Icon name={item.icon} size={22} />
                <span className={styles.menuLabel}>{item.label}</span>
                {item.shelf && shelves[item.shelf].ready && (
                  <span className={styles.menuCount}>{shelves[item.shelf].count}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <nav aria-label="Основная навигация" className={styles.nav}>
        {MAIN.map(link)}
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls="m-more"
          onClick={() => setOpen((v) => !v)}
          className={cx(styles.item, styles.moreBtn, (moreActive || open) && styles.on)}
        >
          <span className={styles.icon}>
            <Icon name="menu" size={22} />
          </span>
          Ещё
        </button>
        {link({ id: "profile", href: profileHref, label: "Профиль", icon: "user" })}
      </nav>
    </div>
  );
}
