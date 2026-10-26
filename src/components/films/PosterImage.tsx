import styles from "./PosterImage.module.scss";

/**
 * Загруженный постер поверх цветной заглушки из эталона.
 * Ставится последним в блоке постера: закрывает фигуры и надпись (название остаётся в разметке для чтения с экрана).
 */
export function PosterImage({ url }: { url?: string | null }) {
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element -- адрес из хранилища (диск, S3, Cloudinary)
  return <img src={url} alt="" loading="lazy" decoding="async" className={styles.img} />;
}
