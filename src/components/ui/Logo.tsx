import Link from "next/link";
import { cx } from "@/lib/cx";
import styles from "./Logo.module.scss";

interface LogoProps {
  /** mobile: точка 12 / 22px (Catalog); desktop: 13 / 24px (DeskCatalog); auth: 14 / 26px (DeskAuth) */
  size: "mobile" | "desktop" | "auth";
  href?: string;
  className?: string;
}

export function Logo({ size, href, className }: LogoProps) {
  const cls = cx(styles.logo, styles[size], className);
  const content = (
    <>
      <span className={styles.dot} aria-hidden="true" />
      Borisjaou
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {content}
    </Link>
  ) : (
    <div className={cls}>{content}</div>
  );
}
