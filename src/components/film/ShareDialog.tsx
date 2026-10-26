"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { filmPosterVar, posterVar } from "@/components/films/poster";
import { cx } from "@/lib/cx";
import { filmMeta } from "@/lib/films/format";
import type { Film } from "@/lib/films/types";
import { displayUrl, filmUrl, shareUrls, type ShareTargetId } from "@/lib/site";
import styles from "./ShareDialog.module.scss";
import { PosterImage } from "@/components/films/PosterImage";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

interface ShareDialogProps {
  film: Film;
  onClose: () => void;
}

/** Цвета кругов: t1 / t2 / t3 / t5 / t4 в Movie = posters[1, 0, 2, 5, 4] */
const TARGETS: ReadonlyArray<{ id: ShareTargetId | "more"; label: string; icon: IconName; color: number }> = [
  { id: "telegram", label: "Telegram", icon: "send", color: 1 },
  { id: "whatsapp", label: "WhatsApp", icon: "message", color: 0 },
  { id: "vk", label: "ВКонтакте", icon: "globe", color: 2 },
  { id: "mail", label: "Почта", icon: "mail", color: 5 },
  { id: "more", label: "Ещё", icon: "more", color: 4 },
];

/** «Поделиться»: шторка снизу (Movie, до 1023px) / окно по центру (DeskMovie, с 1024px) */
export function ShareDialog({ film, onClose }: ShareDialogProps) {
  const url = filmUrl(film.slug);
  const links = shareUrls(url, film.title);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, closeRef);

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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // буфер обмена недоступен (http, запрет браузера) — ссылку можно выделить в поле вручную
    }
    setCopied(true);
  };

  const shareMore = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: film.title, url });
      } catch {
        // пользователь закрыл системное меню
      }
    } else {
      await copy();
    }
  };

  return (
    <div className={styles.root}>
      <button type="button" aria-label="Закрыть" onClick={onClose} className={styles.backdrop} tabIndex={-1} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Поделиться фильмом" className={styles.dialog}>
        <div aria-hidden="true" className={styles.handle} />
        <div className={styles.head}>
          <h2 className={styles.title}>Поделиться</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Закрыть" className={styles.close}>
            <Icon name="close" size={18} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.film}>
          <div className={styles.poster} style={{ background: filmPosterVar(film.posterColor) }}>
            <div aria-hidden="true" className={styles.posterShape} />
            <PosterImage url={film.posterUrl} />
          </div>
          <div className={styles.filmText}>
            <div className={styles.filmTitle}>{film.title}</div>
            <div className={styles.filmMeta}>{filmMeta(film)}</div>
          </div>
        </div>

        <div className={styles.link}>
          <Icon name="link" size={18} className={styles.linkIcon} />
          <label htmlFor="share-url" className="visually-hidden">
            Ссылка на фильм
          </label>
          <input
            id="share-url"
            type="text"
            readOnly
            value={displayUrl(url)}
            onFocus={(e) => e.currentTarget.select()}
            className={styles.input}
          />
          <button type="button" onClick={copy} className={cx(styles.copy, copied && styles.copied)}>
            {copied && <Icon name="check" size={16} className={styles.copyCheck} />}
            {copied ? "Скопировано" : "Копировать"}
          </button>
        </div>

        <div className={styles.targets}>
          {TARGETS.map((t) => {
            const content = (
              <>
                <span className={styles.circle} style={{ background: posterVar(t.color) }}>
                  <Icon name={t.icon} size={22} />
                </span>
                {t.label}
              </>
            );
            return t.id === "more" ? (
              <button key={t.id} type="button" onClick={shareMore} className={styles.target}>
                {content}
              </button>
            ) : (
              <a
                key={t.id}
                href={links[t.id]}
                target={t.id === "mail" ? undefined : "_blank"}
                rel="noopener noreferrer"
                className={styles.target}
              >
                {content}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
