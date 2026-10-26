"use client";

import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { useDesktopRedirect } from "@/lib/hooks/useDesktopRedirect";
import { LogoutButton } from "./AccountActions";
import styles from "./ProfileView.module.scss";

interface ProfileViewProps {
  name: string | null;
  email: string | null;
  isAdmin: boolean;
}

const toCatalog = () => "/";

/**
 * Профиль (мобила): в эталоне экрана нет — собран из элементов Favorites / AdminAdd.
 * На ПК имя и «Выйти» — в шапке, поэтому с ≥1024px уводим в каталог.
 */
export function ProfileView({ name, email, isAdmin }: ProfileViewProps) {
  useDesktopRedirect(toCatalog);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Профиль</h1>
        <ThemeToggle />
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.name}>{name || email}</div>
          {email && <div className={styles.email}>{email}</div>}
        </div>

        {isAdmin && (
          <Link href="/admin/films" className={styles.button}>
            Админка
          </Link>
        )}
        <LogoutButton className={styles.button} />
      </main>

      <BottomNav active="profile" />
    </div>
  );
}
