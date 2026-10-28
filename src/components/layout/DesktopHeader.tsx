"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { AccountActions } from "@/components/account/AccountActions";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { cx } from "@/lib/cx";
import { catalogHref as hrefOf, EMPTY_QUERY, withPit, withShelf, type CatalogQuery } from "@/lib/films/params";
import { PIT } from "@/lib/films/verdictGroups";
import { useDismiss } from "@/lib/hooks/useDismiss";
import { SHELVES, type ShelfId } from "@/lib/shelves";
import { useShelves } from "@/lib/useShelf";
import styles from "./DesktopHeader.module.scss";

export type DesktopSection = "catalog" | "genres" | ShelfId | "yama";

/** Разделы в меню «Ещё» */
const MORE_SECTIONS: readonly DesktopSection[] = ["genres", "watched", "yama"];

interface DesktopHeaderProps {
  active: DesktopSection;
  catalogHref: string;
  /** Запрос каталога, с которым открываются разделы-списки (фильтры и сортировка сохраняются) */
  shelfQuery?: CatalogQuery;
  /** Поле поиска: на каталоге — с задержкой, на остальных — форма на / */
  search: ReactNode;
  isAdmin: boolean;
}

/**
 * Шапка ПК (DeskCatalog / DeskGenres). Порядок: Каталог, Надо посмотреть, Избранное, «Ещё»
 * (Жанры, Просмотрено, Яма — в выпадающем меню).
 */
export function DesktopHeader({ active, catalogHref, shelfQuery = EMPTY_QUERY, search, isAdmin }: DesktopHeaderProps) {
  const shelves = useShelves();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const moreRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useDismiss(open, close, moreRef, buttonRef);

  const shelfHref = (id: ShelfId) => hrefOf(withShelf(shelfQuery, id));
  const badge = (id: ShelfId) => shelves[id].ready && <span className={styles.badge}>{shelves[id].count}</span>;

  const items: ReadonlyArray<{ id: DesktopSection; href: string; label: string; shelf?: ShelfId }> = [
    { id: "catalog", href: catalogHref, label: "Каталог" },
    { id: "watchlist", href: shelfHref("watchlist"), label: SHELVES.watchlist.title, shelf: "watchlist" },
    { id: "favorites", href: shelfHref("favorites"), label: SHELVES.favorites.title, shelf: "favorites" },
  ];
  const more: ReadonlyArray<{ id: DesktopSection; href: string; label: string; shelf?: ShelfId }> = [
    { id: "genres", href: "/genres", label: "Жанры" },
    { id: "watched", href: shelfHref("watched"), label: SHELVES.watched.title, shelf: "watched" },
    { id: "yama", href: hrefOf(withPit(shelfQuery)), label: PIT.title },
  ];
  const moreActive = MORE_SECTIONS.includes(active);

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
              {item.shelf && badge(item.shelf)}
            </Link>
          ))}
          <div ref={moreRef} className={styles.more}>
            <button
              ref={buttonRef}
              type="button"
              aria-expanded={open}
              aria-controls="desk-more"
              onClick={() => setOpen((v) => !v)}
              className={cx(styles.navItem, styles.moreBtn, (moreActive || open) && styles.navOn)}
            >
              Ещё
              <Icon name="chevronDown" size={16} className={cx(styles.chevron, open && styles.chevronOpen)} />
            </button>
            {open && (
              <ul id="desk-more" className={styles.menu}>
                {more.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      scroll={false}
                      onClick={close}
                      aria-current={item.id === active ? "page" : undefined}
                      className={cx(styles.menuItem, item.id === active && styles.menuOn)}
                    >
                      {item.label}
                      {item.shelf && badge(item.shelf)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
