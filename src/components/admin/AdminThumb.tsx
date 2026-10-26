import { filmPosterVar } from "@/components/films/poster";
import type { Film } from "@/lib/films/types";
import styles from "./AdminThumb.module.scss";

/** Миниатюра постера 48×68 в списке AdminFilms */
export function AdminThumb({ film }: { film: Pick<Film, "posterColor" | "posterUrl"> }) {
  return (
    <div className={styles.thumb} style={{ background: filmPosterVar(film.posterColor) }}>
      {film.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- адрес из хранилища (диск, S3, Cloudinary)
        <img src={film.posterUrl} alt="" className={styles.img} />
      ) : (
        <div aria-hidden="true" className={styles.shape} />
      )}
    </div>
  );
}
