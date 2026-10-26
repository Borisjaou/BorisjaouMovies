import Link from "next/link";
import { Fragment } from "react";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { cx } from "@/lib/cx";
import styles from "./AdminHeader.module.scss";

export interface Crumb {
  label: string;
  href?: string;
}

/** Шапка админки на ПК: DeskAdminFilms / DeskAdminAdd */
export function AdminHeader({ crumbs }: { crumbs: readonly Crumb[] }) {
  const last = crumbs.length - 1;
  return (
    <header className={cx(styles.header, "only-desktop")}>
      <div className={styles.inner}>
        <Logo size="desktop" href="/" />
        <span className={styles.badge}>Администратор</span>
        <nav aria-label="Хлебные крошки" className={cx(styles.crumbs, last === 0 && styles.single)}>
          {crumbs.map((c, i) => (
            <Fragment key={c.label}>
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === last ? (
                <span aria-current="page" className={styles.current}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href ?? "#"} className={styles.link}>
                  {c.label}
                </Link>
              )}
            </Fragment>
          ))}
        </nav>
        <div className={styles.actions}>
          <ThemeToggle />
          <Link href="/" className={styles.site}>
            На сайт
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Плашка «Администратор» (мобильная шапка AdminFilms: 12px) */
export function AdminBadge({ className }: { className?: string }) {
  return <span className={cx(styles.badge, styles.badgeMobile, className)}>Администратор</span>;
}
