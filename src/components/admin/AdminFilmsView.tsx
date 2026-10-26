"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { SearchField } from "@/components/ui/SearchField";
import { Segmented } from "@/components/ui/Segmented";
import { cx } from "@/lib/cx";
import type { Film } from "@/lib/films/types";
import { AdminBadge, AdminHeader } from "./AdminHeader";
import { AdminThumb } from "./AdminThumb";
import styles from "./AdminFilmsView.module.scss";

type Tab = "all" | "published" | "draft";

export type AdminFilmItem = Pick<Film, "id" | "title" | "year" | "genres" | "status" | "posterColor" | "posterUrl">;

/** Список фильмов админки: AdminFilms (мобила) / DeskAdminFilms (ПК). Вкладки и поиск по названию — как в эталоне. */
export function AdminFilmsView({ films }: { films: readonly AdminFilmItem[] }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  const published = films.filter((f) => f.status === "published").length;
  const tabs = [
    { id: "all", label: `Все · ${films.length}` },
    { id: "published", label: `Опубл. · ${published}` },
    { id: "draft", label: `Черновики · ${films.length - published}` },
  ] as const;

  const needle = q.toLowerCase();
  const list = films.filter(
    (f) => (tab === "all" || f.status === tab) && (!needle || f.title.toLowerCase().includes(needle)),
  );

  const search = (id: string) => (
    <SearchField
      id={id}
      label="Поиск по фильмам"
      placeholder="Название фильма"
      size="admin"
      value={q}
      onChange={(e) => setQ(e.target.value)}
    />
  );
  const tablist = (className: string) => (
    <Segmented
      options={tabs}
      value={tab}
      onChange={setTab}
      ariaLabel="Статус"
      role="tablist"
      itemHeight={40}
      fontSize={13}
      className={className}
    />
  );

  return (
    <div className={styles.page}>
      {/* ---------- Мобила: AdminFilms ---------- */}
      <header className={cx(styles.mHeader, "only-mobile")}>
        <div className={styles.mTop}>
          <Link href="/" className={styles.mBack}>
            <Icon name="back" size={18} />
            На сайт
          </Link>
          <div className={styles.mTopActions}>
            <AdminBadge />
            <ThemeToggle />
          </div>
        </div>
        <h1 className={styles.mTitle}>Фильмы</h1>
        {search("admin-search")}
        {tablist(styles.mTabs)}
      </header>

      {/* ---------- ПК: DeskAdminFilms ---------- */}
      <AdminHeader crumbs={[{ label: "Фильмы" }]} />

      <main className={styles.main}>
        <div className={styles.column}>
          <div className={cx(styles.dTop, "only-desktop")}>
            <h1 className={styles.dTitle}>Фильмы</h1>
            <Link href="/admin/films/new" className={styles.dAdd}>
              <Icon name="plus" size={20} />
              Добавить фильм
            </Link>
          </div>
          <div className={cx(styles.dTools, "only-desktop")}>
            {search("af-search")}
            {tablist(styles.dTabs)}
          </div>

          <ul className={styles.list}>
            {list.map((f) => (
              <li key={f.id} className={styles.row}>
                <AdminThumb film={f} />
                <div className={styles.info}>
                  <div className={styles.name}>{f.title}</div>
                  <div className={styles.meta}>
                    {f.year} · {f.genres[0] ?? ""}
                  </div>
                  <StatusPill status={f.status} className="only-mobile" />
                </div>
                <StatusPill status={f.status} className="only-desktop" />
                <Link href={`/admin/films/${f.id}/edit`} aria-label={`Редактировать: ${f.title}`} className={styles.edit}>
                  <Icon name="edit" size={20} />
                </Link>
              </li>
            ))}
          </ul>
          {list.length === 0 && <div className={styles.empty}>Ничего не найдено</div>}
        </div>

        <div className={cx(styles.fab, "only-mobile")}>
          <Link href="/admin/films/new" className={styles.fabLink}>
            <Icon name="plus" size={20} />
            Добавить фильм
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatusPill({ status, className }: { status: Film["status"]; className?: string }) {
  const published = status === "published";
  return (
    <span className={cx(styles.status, published ? styles.pub : styles.draft, className)}>
      {published ? "Опубликован" : "Черновик"}
    </span>
  );
}
