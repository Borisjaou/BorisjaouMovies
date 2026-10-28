"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { cx } from "@/lib/cx";
import { VERDICT_LABELS, type ImhoValue } from "@/lib/films/imho";
import { imhoDate } from "./format";
import { ImhoForm } from "./ImhoForm";
import styles from "./Imho.module.scss";

interface ImhoBlockProps {
  filmId: number;
  value: ImhoValue;
  onChange: (value: ImhoValue) => void;
  /** f — мобила, d — ПК (id полей не должны совпадать) */
  layout: "f" | "d";
}

/**
 * «ИМХО» на странице фильма: оценка и комментарий автора, видно всем.
 * Админ: пустое ИМХО — сразу форма, заполненное — с кнопкой «Изменить».
 */
export function ImhoBlock({ filmId, value, onChange, layout }: ImhoBlockProps) {
  const router = useRouter();
  const { data } = useSession();
  const isAdmin = data?.user?.role === "admin";
  const [editing, setEditing] = useState(false);
  const empty = value.verdict === null && value.imho === "";

  if (empty && !isAdmin) return null;

  const showForm = isAdmin && (editing || empty);
  const headingId = `${layout}-imho-title`;

  return (
    <section aria-labelledby={headingId} className={cx(styles.block, showForm && styles.blockEdit, layout === "d" && styles.blockD)}>
      <div className={styles.head}>
        <h2 id={headingId} className={styles.title}>
          ИМХО
        </h2>
        {showForm ? (
          <span className={styles.hint}>видно всем</span>
        ) : (
          <div className={styles.headRight}>
            {value.verdict && (
              <span className={cx(styles.pill, value.verdict === "liked" ? styles.pillLiked : styles.pillDisliked)}>
                <Icon name={value.verdict === "liked" ? "thumbUp" : "thumbDown"} size={16} />
                {VERDICT_LABELS[value.verdict]}
              </span>
            )}
            {isAdmin && (
              <button type="button" onClick={() => setEditing(true)} aria-label="Изменить ИМХО" className={styles.editBtn}>
                <Icon name="edit" size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {showForm ? (
        <ImhoForm
          filmId={filmId}
          initial={value}
          idPrefix={layout}
          onSaved={(next) => {
            onChange(next);
            setEditing(false);
            router.refresh();
          }}
          secondaryLabel="Отмена"
          onSecondary={empty ? undefined : () => setEditing(false)}
        />
      ) : (
        <>
          {value.imho && <p className={styles.text}>{value.imho}</p>}
          {value.imhoAt && <div className={styles.date}>{imhoDate(value.imhoAt)}</div>}
        </>
      )}
    </section>
  );
}
