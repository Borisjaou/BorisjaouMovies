"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AccountActions } from "@/components/account/AccountActions";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { cx } from "@/lib/cx";
import { useFavorites } from "@/lib/favorites";
import styles from "./DesktopHeader.module.scss";

export type DesktopSection = "catalog" | "genres" | "favorites";

interface DesktopHeaderProps {
  active: DesktopSection;
  catalogHref: string;
  favoritesHref: string;
  /** Поле поиска: на каталоге — с задержкой, на остальных — форма на / */
  search: ReactNode;
  isAdmin: boolean;
}

/** Шапка ПК: DeskCatalog / DeskGenres */
export function DesktopHeader({ active, catalogHref, favoritesHref, search, isAdmin }: DesktopHeaderProps) {
  const { count, ready } = useFavorites();

  const items: ReadonlyArray<{ id: DesktopSection; href: string; label: string }> = [
    { id: "catalog", href: catalogHref, label: "Каталог" },
    { id: "genres", href: "/genres", label: "Жанры" },
    { id: "favorites", href: favoritesHref, label: "Избранное" },
  ];

  return (
    <header className={cx(styles.header, "only-desktop")}>
      <div className={styles.inner}>
        <Logo size="desktop" href="/" />
        <nav aria-label="Разделы" className={styles.nav}>
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              scroll={false}
              aria-current={item.id === active ? "page" : undefined}
              className={cx(styles.navItem, item.id === active && styles.navOn)}
            >
              {item.label}
              {item.id === "favorites" && ready && <span className={styles.badge}>{count}</span>}
            </Link>
          ))}
        </nav>
        <div className={styles.search}>{search}</div>
        <div className={styles.actions}>
          <ThemeToggle />
          {isAdmin && (
            <Link href="/admin" className={styles.admin}>
              Админка
            </Link>
          )}
          <AccountActions />
        </div>
      </div>
    </header>
  );
}
