import Link from "next/link";
import type { Film } from "@/lib/films/types";
import { freshPosterVar } from "./poster";
import styles from "./FreshCard.module.scss";

/** Карточка «Новинок»: Catalog (270×150, прокрутка) / DeskCatalog (сетка, с описанием) */
export function FreshCard({ film }: { film: Film }) {
  return (
    <Link href={`/film/${film.slug}`} className={styles.card} style={{ background: freshPosterVar(film.posterColor) }}>
      <div aria-hidden="true" className={styles.shape} />
      <span className={styles.tag}>
        {film.year} · {film.genres[0]}
      </span>
      <span className={styles.bottom}>
        <span className={styles.title}>{film.title}</span>
        <span className={styles.desc}>{film.shortDescription}</span>
      </span>
    </Link>
  );
}
