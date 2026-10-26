import { Icon } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./Toast.module.scss";

interface ToastProps {
  message: string;
  /** desktop — по центру снизу (DeskCatalog), mobile — над нижним меню (Favorites) */
  placement: "desktop" | "mobile";
}

export function Toast({ message, placement }: ToastProps) {
  if (!message) return null;
  return (
    <div role="status" className={cx(styles.toast, styles[placement])}>
      <Icon name="check" size={18} strokeWidth={2.2} />
      {message}
    </div>
  );
}
