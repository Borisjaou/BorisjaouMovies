"use client";

import { useState, useTransition, type RefObject } from "react";
import { saveImhoAction } from "@/app/actions/imho";
import { Icon } from "@/components/icons";
import { FormAlert } from "@/components/ui/FormAlert";
import { cx } from "@/lib/cx";
import { IMHO_MAX, VERDICT_LABELS, type ImhoValue } from "@/lib/films/imho";
import { VERDICTS, type Verdict } from "@/lib/films/types";
import styles from "./Imho.module.scss";

interface ImhoFormProps {
  filmId: number;
  initial: ImhoValue;
  /** Уникальная часть id полей (на странице две раскладки) */
  idPrefix: string;
  onSaved: (value: ImhoValue) => void;
  /** Вторая кнопка: «Отмена» в блоке, «Пропустить» в окне */
  secondaryLabel?: string;
  onSecondary?: () => void;
  size?: "md" | "lg";
  firstRef?: RefObject<HTMLButtonElement | null>;
}

const VERDICT_ICON = { liked: "thumbUp", disliked: "thumbDown" } as const;

/** Оценка «Понравился / Не понравился» + комментарий. Повторный клик по оценке снимает её. */
export function ImhoForm({
  filmId,
  initial,
  idPrefix,
  onSaved,
  secondaryLabel,
  onSecondary,
  size = "md",
  firstRef,
}: ImhoFormProps) {
  const [verdict, setVerdict] = useState<Verdict | null>(initial.verdict);
  const [imho, setImho] = useState(initial.imho);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const noteId = `${idPrefix}-imho-note`;

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveImhoAction({ filmId, verdict, imho });
        if (result.ok) onSaved(result.value);
        else setError(result.error);
      } catch {
        setError("Не удалось сохранить. Обновите страницу и попробуйте ещё раз");
      }
    });
  };

  return (
    <div className={styles.form} aria-busy={pending}>
      <div role="group" aria-label="Оценка" className={cx(styles.verdicts, size === "lg" && styles.verdictsLg)}>
        {VERDICTS.map((v, i) => (
          <button
            key={v}
            ref={i === 0 ? firstRef : undefined}
            type="button"
            aria-pressed={verdict === v}
            onClick={() => setVerdict((cur) => (cur === v ? null : v))}
            className={cx(styles.verdict, verdict === v && styles.verdictOn)}
          >
            <Icon name={VERDICT_ICON[v]} size={size === "lg" ? 26 : 18} />
            {VERDICT_LABELS[v]}
          </button>
        ))}
      </div>
      <div className={styles.field}>
        <label htmlFor={noteId} className={styles.label}>
          Комментарий — видят все
        </label>
        <textarea
          id={noteId}
          rows={3}
          maxLength={IMHO_MAX}
          value={imho}
          onChange={(e) => setImho(e.target.value)}
          placeholder="Почему стоит посмотреть (или не стоит)"
          className={styles.textarea}
        />
      </div>
      <FormAlert message={error} />
      <div className={styles.buttons}>
        {onSecondary && (
          <button type="button" onClick={onSecondary} disabled={pending} className={styles.secondary}>
            {secondaryLabel ?? "Отмена"}
          </button>
        )}
        <button type="button" onClick={save} disabled={pending} className={styles.primary}>
          {pending ? "Сохраняю…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
