"use client";

import { useTheme } from "next-themes";
import { Icon } from "@/components/icons";
import styles from "./ThemeToggle.module.css";

export type ThemeToggleVariant = "outline" | "glass";

interface ThemeToggleProps {
  /** outline — с рамкой на surface (большинство экранов), glass — поверх постера (Movie) */
  variant?: ThemeToggleVariant;
  className?: string;
}

export function ThemeToggle({ variant = "outline", className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const cls = [styles.toggle, styles[variant], className].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Сменить тему"
      className={cls}
    >
      {/* В тёмной теме — солнце, в светлой — луна. Выбор через CSS: без рассинхрона при гидрации. */}
      <Icon name="sun" size={20} className={styles.sun} />
      <Icon name="moon" size={20} className={styles.moon} />
    </button>
  );
}
