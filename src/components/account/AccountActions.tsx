"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import styles from "./AccountActions.module.scss";

/**
 * Правый край шапки ПК: гость — «Войти», вошедший — имя и «Выйти» (та же кнопка, что «Войти»).
 * Сессия приходит с сервера (Providers), поэтому «Войти» не мелькает у вошедшего.
 */
export function AccountActions({ className }: { className?: string }) {
  const { data, status } = useSession();
  const [pending, setPending] = useState(false);

  if (status !== "authenticated" || !data.user) {
    return (
      <Link href="/login" className={`${styles.button} ${className ?? ""}`}>
        Войти
      </Link>
    );
  }

  const name = data.user.name || data.user.email || "";
  return (
    <>
      <span className={styles.name} title={data.user.email ?? undefined}>
        {name}
      </span>
      <LogoutButton className={`${styles.button} ${className ?? ""}`} pending={pending} setPending={setPending} />
    </>
  );
}

interface LogoutButtonProps {
  className?: string;
  pending?: boolean;
  setPending?: (v: boolean) => void;
}

/** «Выйти»: завершает сессию и возвращает на главную (избранное снова хранится в браузере) */
export function LogoutButton({ className, pending = false, setPending }: LogoutButtonProps) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending?.(true);
        void signOut({ redirectTo: "/" });
      }}
      className={className}
    >
      Выйти
    </button>
  );
}
