"use client";

import Link from "next/link";
import { useRef } from "react";
import type { SavedFilm } from "@/app/admin/films/actions";
import { Icon } from "@/components/icons";
import { FILM_LINK_BASE } from "@/lib/films/constants";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import styles from "./SuccessDialog.module.scss";

interface SuccessDialogProps {
  film: SavedFilm;
  onAddAnother: () => void;
}

/** Окно успеха AdminAdd (шторка) / DeskAdminAdd (по центру, 480) */
export function SuccessDialog({ film, onAddAnother }: SuccessDialogProps) {
  const firstButton = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, firstButton);

  const published = film.status === "published";
  const title = published ? "Фильм опубликован" : "Черновик сохранён";

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} aria-hidden="true" />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} className={styles.dialog}>
        <div aria-hidden="true" className={styles.ok}>
          <Icon name="check" size={30} className={styles.okIcon} />
        </div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.text}>
          {published ? (
            `«${film.title}» уже в каталоге${film.isNew ? " и в «Новинках»" : ""}. Ссылкой можно делиться.`
          ) : (
            <>
              «{film.title}» виден только администраторам.
              {/* На мобиле в эталоне текст длиннее */}
              <span className="only-mobile"> Опубликовать можно из списка фильмов.</span>
            </>
          )}
        </p>
        <div className={styles.link}>
          {FILM_LINK_BASE}
          {film.slug}
        </div>
        <div className={styles.buttons}>
          <button ref={firstButton} type="button" onClick={onAddAnother} className={styles.again}>
            Добавить ещё
          </button>
          <Link href="/admin/films" className={styles.toList}>
            К списку
          </Link>
        </div>
      </div>
    </div>
  );
}
