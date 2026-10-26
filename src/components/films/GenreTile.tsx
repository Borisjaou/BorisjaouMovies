import Link from "next/link";
import { cx } from "@/lib/cx";
import type { Genre } from "@/lib/films/constants";
import { posterVar } from "./poster";
import styles from "./GenreTile.module.scss";

interface GenreTileProps {
  genre: Genre;
  /** Позиция в списке: цвет posters[(i * 5) % 6], фигура SHAPES[i % 3] */
  index: number;
  href: string;
}

/** Плитка жанра: Genres (124px) / DeskGenres (160px) */
export function GenreTile({ genre, index, href }: GenreTileProps) {
  return (
    <Link href={href} className={styles.tile} style={{ background: posterVar(index * 5) }}>
      <div aria-hidden="true" className={cx(styles.shape, styles[`shape${index % 3}`])} />
      <span className={styles.label}>{genre}</span>
    </Link>
  );
}
