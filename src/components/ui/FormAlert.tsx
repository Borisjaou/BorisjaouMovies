import styles from "./FormAlert.module.scss";

/** Ошибка формы целиком — как блок role="alert" в AdminAdd / DeskAdminAdd */
export function FormAlert({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div role="alert" className={styles.alert}>
      {message}
    </div>
  );
}
