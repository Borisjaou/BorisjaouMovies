"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AccountActions } from "@/components/account/AccountActions";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { cx } from "@/lib/cx";
import { catalogHref as hrefOf, EMPTY_QUERY, withShelf, type CatalogQuery } from "@/lib/films/params";
import { SHELF_ORDER, SHELVES, type ShelfId } from "@/lib/shelves";
import { useShelves } from "@/lib/useShelf";
import styles from "./DesktopHeader.module.scss";

export type DesktopSection = "catalog" | "genres" | ShelfId;

interface DesktopHeaderProps {
  active: DesktopSection;
  catalogHref: string;
  /** Запрос каталога, с которым открываются разделы-списки (фильтры и сортировка сохраняются) */
  shelfQuery?: CatalogQuery;
  /** Поле поиска: на каталоге — с задержкой, на остальных — форма на / */
  search: ReactNode;
  isAdmin: boolean;
}

/** Шапка ПК: DeskCatalog / DeskGenres */
export function DesktopHeader({ active, catalogHref, shelfQuery = EMPTY_QUERY, search, isAdmin }: DesktopHeaderProps) {
  const shelves = useShelves();

  // «Надо посмотреть» и «Просмотрено» — перед «Избранным»
  const items: ReadonlyArray<{ id: DesktopSection; href: string; label: string; shelf?: ShelfId }> = [
    { id: "catalog", href: catalogHref, label: "Каталог" },
    { id: "genres", href: "/genres", label: "Жанры" },
    ...SHELF_ORDER.map((id) => ({ id, href: hrefOf(withShelf(shelfQuery, id)), label: SHELVES[id].title, shelf: id })),
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
              {item.shelf && <Icon name={SHELVES[item.shelf].icon} size={20} className={styles.navIcon} />}
              <span className={cx(item.shelf && styles.shelfLabel)}>{item.label}</span>
              {item.shelf && shelves[item.shelf].ready && (
                <span className={styles.badge}>{shelves[item.shelf].count}</span>
              )}
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
