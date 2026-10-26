import Link from "next/link";
import styles from "./NotFoundView.module.scss";

/** 404 — в стиле пустого состояния каталога */
export function NotFoundView({ title, text }: { title: string; text: string }) {
  return (
    <main className={styles.page}>
      <div className={styles.box}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.text}>{text}</p>
        <Link href="/" className={styles.button}>
          Показать все фильмы
        </Link>
      </div>
    </main>
  );
}
