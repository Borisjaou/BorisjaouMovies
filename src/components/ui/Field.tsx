import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Field.module.scss";

interface FieldProps {
  id: string;
  label: string;
  /** Текст ошибки — поле и подпись под ним красятся в --err */
  error?: string;
  /** Только красная рамка, без текста (незаполненное обязательное поле в AdminAdd) */
  invalid?: boolean;
  /** Справа от подписи («Забыли пароль?», счётчик символов) */
  aside?: ReactNode;
  /** Подписи 13px на мобиле / 14px на ПК */
  children: ReactNode;
  className?: string;
}

/** Поле формы эталона: подпись muted, поле, ошибка под полем */
export function Field({ id, label, error, invalid, aside, children, className }: FieldProps) {
  return (
    <div className={cx(styles.field, (error || invalid) && styles.invalid, className)}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

/** id сообщения об ошибке для aria-describedby */
export function errorId(id: string, error?: string): string | undefined {
  return error ? `${id}-error` : undefined;
}
