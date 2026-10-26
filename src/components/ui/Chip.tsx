import { Icon } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./Chip.module.scss";

interface ChipProps {
  label: string;
  on: boolean;
  onClick: () => void;
  /** Галочка у выбранного (жанры в Filters, «Все жанры» в DeskCatalog) */
  check?: boolean;
  /** md — padding 0 16 (каталог), sm — 0 14 (фильтры), age — ширина 56 */
  size?: "md" | "sm" | "age";
  className?: string;
}

export function Chip({ label, on, onClick, check = false, size = "md", className }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(styles.chip, styles[size], on && styles.on, className)}
    >
      {check && on && <Icon name="check" size={16} />}
      {label}
    </button>
  );
}
