import type { ChangeEvent } from "react";
import { Icon } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./SearchField.module.scss";

interface SearchFieldProps {
  id: string;
  label: string;
  placeholder: string;
  /** lg — 52 / r16 (Catalog), md — 48 / r16 (шапка ПК), admin — 48 / r14 (AdminFilms) */
  size: "lg" | "md" | "admin";
  value?: string;
  defaultValue?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  className?: string;
}

export function SearchField({ id, label, placeholder, size, value, defaultValue, onChange, name, className }: SearchFieldProps) {
  return (
    <div className={cx(styles.wrap, styles[size], className)}>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <Icon name="search" size={20} className={styles.icon} />
      <input
        id={id}
        name={name}
        type="search"
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        className={styles.input}
      />
    </div>
  );
}
