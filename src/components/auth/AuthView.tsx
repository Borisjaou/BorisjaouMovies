import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { cx } from "@/lib/cx";
import { AuthForm, type AuthMode } from "./AuthForm";
import styles from "./AuthView.module.scss";

const TITLE = "Всё ваше кино — в одном месте";
const TEXT = "Сохраняйте фильмы в избранное и делитесь ими с друзьями.";

function Posters({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx(styles.posters, className)}>
      <div className={cx(styles.poster, styles.p1)}>
        <div className={styles.s1} />
      </div>
      <div className={cx(styles.poster, styles.p2)}>
        <div className={styles.s2} />
      </div>
      <div className={cx(styles.poster, styles.p3)}>
        <div className={styles.s3} />
      </div>
    </div>
  );
}

/** Вход: Main.dc.html (до 1023px) / DeskAuth.dc.html (с 1024px) */
export function AuthView({
  callbackUrl,
  mode,
  initialError,
}: {
  callbackUrl: string;
  mode: AuthMode;
  initialError?: string | null;
}) {
  return (
    <div className={styles.page}>
      {/* ПК: левая панель */}
      <aside aria-label="О сервисе" className={cx(styles.panel, "only-desktop")}>
        <Logo size="auth" href="/" className={styles.panelLogo} />
        <Posters />
        <div className={styles.panelText}>
          <div className={styles.panelTitle}>{TITLE}</div>
          <div className={styles.panelSub}>{TEXT}</div>
        </div>
      </aside>

      <main className={styles.side}>
        {/* Мобила: шапка */}
        <header className={cx(styles.mHeader, "only-mobile")}>
          <Logo size="mobile" href="/" />
          <ThemeToggle />
        </header>
        {/* ПК: кнопка темы в углу */}
        <ThemeToggle className={cx(styles.dTheme, "only-desktop")} />

        <div className={styles.column}>
          <Posters className="only-mobile" />
          <div className={cx(styles.mIntro, "only-mobile")}>
            <h1 className={styles.mTitle}>{TITLE}</h1>
            <p className={styles.mText}>{TEXT}</p>
          </div>

          <AuthForm
            callbackUrl={callbackUrl}
            mode={mode}
            initialError={initialError}
            headingClassName={styles.dHeading}
          />

          <Link href="/" className={styles.guest}>
            Смотреть без входа
          </Link>
        </div>
      </main>
    </div>
  );
}
