"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/icons";
import type { DuplicateFilm } from "@/lib/films/adminRepository";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import styles from "./DuplicateDialog.module.scss";

interface DuplicateDialogProps {
  duplicates: DuplicateFilm[];
  /** Правка существующего фильма: кнопка «Сохранить всё равно» */
  editing: boolean;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** «Похожий фильм уже есть» — перед сохранением, если совпало название или источник (не из эталона, в стиле окна успеха) */
export function DuplicateDialog({ duplicates, editing, pending, onConfirm, onCancel }: DuplicateDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, cancelRef);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const sameSource = duplicates.some((d) => d.reason === "source");
  const title = duplicates.length > 1 ? "Похожие фильмы уже есть" : "Похожий фильм уже есть";

  return (
    <div className={styles.root}>
      <button type="button" aria-label="Закрыть" onClick={onCancel} className={styles.backdrop} tabIndex={-1} />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dup-title"
        aria-describedby="dup-text"
        className={styles.dialog}
      >
        <div aria-hidden="true" className={styles.mark}>
          <Icon name="link" size={26} />
        </div>
        <h2 id="dup-title" className={styles.title}>
          {title}
        </h2>
        <p id="dup-text" className={styles.text}>
          {sameSource
            ? "Этот фильм уже добавлен по той же ссылке. Точно добавить ещё раз?"
            : "Совпадает название. Если это другой фильм (например, ремейк), его можно добавить."}
        </p>
        <ul className={styles.list}>
          {duplicates.map((d) => (
            <li key={d.id}>
              <Link href={`/admin/films/${d.id}/edit`} target="_blank" className={styles.item}>
                <span className={styles.itemTitle}>
                  {d.title} <span className={styles.year}>({d.year})</span>
                </span>
                <span className={styles.badge}>
                  {d.reason === "source" ? "та же ссылка" : d.status === "draft" ? "черновик" : "на сайте"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className={styles.buttons}>
          <button ref={cancelRef} type="button" onClick={onCancel} className={styles.cancel}>
            Отмена
          </button>
          <button type="button" onClick={onConfirm} disabled={pending} className={styles.confirm}>
            {editing ? "Сохранить всё равно" : "Добавить всё равно"}
          </button>
        </div>
      </div>
    </div>
  );
}
