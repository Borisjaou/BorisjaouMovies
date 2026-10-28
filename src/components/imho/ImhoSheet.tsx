"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/icons";
import type { ImhoValue } from "@/lib/films/imho";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { ImhoForm } from "./ImhoForm";
import styles from "./Imho.module.scss";

interface ImhoSheetProps {
  film: { id: number; title: string };
  value: ImhoValue;
  onSaved: (value: ImhoValue) => void;
  onClose: () => void;
}

/** «Как вам фильм?» — после отметки «Просмотрено» (только админ). Шторка на мобиле, окно на ПК. */
export function ImhoSheet({ film, value, onSaved, onClose }: ImhoSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(dialogRef, firstRef);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className={styles.sheetRoot}>
      <button type="button" aria-label="Закрыть" onClick={onClose} className={styles.backdrop} tabIndex={-1} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="imho-sheet-title" className={styles.sheet}>
        <div aria-hidden="true" className={styles.handle} />
        <div className={styles.sheetHead}>
          <div className={styles.sheetTitles}>
            <div className={styles.hint}>Добавлено в «Просмотрено»</div>
            <h2 id="imho-sheet-title" className={styles.sheetTitle}>
              Как вам «{film.title}»?
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть" className={styles.close}>
            <Icon name="close" size={18} strokeWidth={2} />
          </button>
        </div>
        <ImhoForm
          filmId={film.id}
          initial={value}
          idPrefix="sheet"
          size="lg"
          firstRef={firstRef}
          onSaved={(next) => {
            onSaved(next);
            onClose();
          }}
          secondaryLabel="Пропустить"
          onSecondary={onClose}
        />
      </div>
    </div>
  );
}
