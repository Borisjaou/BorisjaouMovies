"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { cx } from "@/lib/cx";
import styles from "./Segmented.module.scss";

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  /** null — ничего не выбрано */
  value: T | null;
  onChange: (id: T) => void;
  ariaLabel: string;
  role?: "radiogroup" | "tablist";
  /** grid — равные колонки; inline — по ширине текста (сортировка DeskCatalog) */
  layout?: "grid" | "inline";
  /** compact — padding 3 / r14 / кнопки r11 (ПК); иначе padding 4 / r16 / r12 */
  compact?: boolean;
  itemHeight: number;
  fontSize: number;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  role = "radiogroup",
  layout = "grid",
  compact = false,
  itemHeight,
  fontSize,
  className,
}: SegmentedProps<T>) {
  const style = {
    "--seg-cols": options.length,
    "--seg-h": `${itemHeight}px`,
    "--seg-fs": `${fontSize}px`,
  } as CSSProperties;
  const itemRole = role === "tablist" ? "tab" : "radio";
  const current = options.findIndex((o) => o.id === value);

  // Клавиатура как у radiogroup / tablist: стрелки и Home / End переключают и переносят фокус
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    let next: number;
    if (e.key in keys) next = ((current < 0 ? 0 : current) + keys[e.key] + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    else return;
    e.preventDefault();
    onChange(options[next].id);
    const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>("button");
    buttons[next]?.focus();
  };

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className={cx(styles.group, styles[layout], compact && styles.compact, className)}
      style={style}
      onKeyDown={onKeyDown}
    >
      {options.map((o, i) => {
        const on = o.id === value;
        // В группу попадаем одним Tab — на выбранный пункт (или первый, если ничего не выбрано)
        const tabbable = on || (current < 0 && i === 0);
        return (
          <button
            key={o.id}
            type="button"
            role={itemRole}
            {...(itemRole === "tab" ? { "aria-selected": on } : { "aria-checked": on })}
            tabIndex={tabbable ? 0 : -1}
            onClick={() => onChange(o.id)}
            className={cx(styles.item, on && styles.on)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
