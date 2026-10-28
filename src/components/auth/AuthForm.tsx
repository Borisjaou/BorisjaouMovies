"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import {
  loginAction,
  registerAction,
  googleAction,
  type AuthResult,
} from "@/app/login/actions";
import { Icon } from "@/components/icons";
import { errorId, Field } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import inputStyles from "@/components/ui/Input.module.scss";
import { cx } from "@/lib/cx";
import { loginSchema, registerSchema } from "@/lib/auth/schemas";
import styles from "./AuthForm.module.scss";

export type AuthMode = "login" | "register";
type Mode = AuthMode;

interface Values {
  name: string;
  email: string;
  password: string;
}

const FIELDS = ["name", "email", "password"] as const;

interface AuthFormProps {
  callbackUrl: string;
  /**
   * Регистрация закрыта: вкладки нет, форма создания аккаунта открывается
   * только по прямой ссылке /login?mode=register и пускает лишь почты из ADMIN_EMAILS
   */
  mode: Mode;
  /** Ошибка, пришедшая в адресе (например, отказ во входе через Google) */
  initialError?: string | null;
  /** Класс заголовка над вкладками — он виден только на ПК (DeskAuth) */
  headingClassName?: string;
}

/** Вход (регистрация — только для админа по прямой ссылке): поля, соцсети (Main / DeskAuth) */
export function AuthForm({ callbackUrl, mode, initialError = null, headingClassName }: AuthFormProps) {
  const router = useRouter();
  const { update: refreshSession } = useSession();
  const [showPass, setShowPass] = useState(false);
  const [formError, setFormError] = useState<string | null>(initialError);
  const [pending, startTransition] = useTransition();

  // Регистрация проверяет ещё имя и длину пароля
  const resolver: Resolver<Values> = async (values) => {
    const schema = mode === "register" ? registerSchema : loginSchema;
    const result = schema.safeParse(values);
    if (result.success) return { values, errors: {} };
    const errors: FieldErrors<Values> = {};
    for (const issue of result.error.issues) {
      const key = FIELDS.find((f) => f === issue.path[0]);
      if (key && !errors[key])
        errors[key] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors };
  };

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver,
    defaultValues: { name: "", email: "", password: "" },
  });

  const applyResult = async (result: AuthResult) => {
    if (result.ok) {
      // Обновляем клиентскую сессию: избранное переключится на базу и заберёт гостевой список
      await refreshSession();
      router.replace(result.redirectTo);
      router.refresh();
      return;
    }
    setFormError(result.formError ?? null);
    for (const key of FIELDS) {
      const message = result.fieldErrors?.[key];
      if (message)
        setError(key, { type: "server", message }, { shouldFocus: true });
    }
  };

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      await applyResult(
        mode === "register"
          ? await registerAction(values, callbackUrl)
          : await loginAction(
              { email: values.email, password: values.password },
              callbackUrl,
            ),
      );
    });
  });

  const onGoogle = () => {
    setFormError(null);
    startTransition(async () => applyResult(await googleAction(callbackUrl)));
  };

  const input = cx(inputStyles.input, inputStyles.lg);

  return (
    <>
      {/* DeskAuth: «С возвращением» / «Создайте аккаунт» */}
      <h1 className={cx(headingClassName, "only-desktop")}>
        {mode === "register" ? "Создайте аккаунт" : "С возвращением"}
      </h1>

      <form
        onSubmit={onSubmit}
        noValidate
        className={styles.form}
        aria-busy={pending}
      >
        <FormAlert message={formError} />

        {mode === "register" && (
          <Field id="auth-name" label="Имя" error={errors.name?.message}>
            <input
              id="auth-name"
              type="text"
              autoComplete="name"
              placeholder="Как к вам обращаться"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errorId("auth-name", errors.name?.message)}
              className={input}
              {...register("name")}
            />
          </Field>
        )}

        <Field
          id="auth-email"
          label="Эл. почта"
          error={errors.email?.message}
        >
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@mail.ru"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errorId("auth-email", errors.email?.message)}
            className={input}
            {...register("email")}
          />
        </Field>

        <Field
          id="auth-pass"
          label="Пароль"
          error={errors.password?.message}
          aside={
            mode === "login" && (
              <a href="#" className={styles.forgot}>
                Забыли пароль?
              </a>
            )
          }
        >
          <div className={styles.passWrap}>
            <input
              id="auth-pass"
              type={showPass ? "text" : "password"}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              placeholder="Минимум 8 символов"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errorId(
                "auth-pass",
                errors.password?.message,
              )}
              className={cx(input, styles.passInput)}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Скрыть пароль" : "Показать пароль"}
              className={styles.eye}
            >
              <Icon name="eye" size={20} />
            </button>
          </div>
        </Field>

        <button type="submit" disabled={pending} className={styles.submit}>
          {mode === "register" ? "Создать аккаунт" : "Войти"}
        </button>
      </form>

      <div className={styles.divider}>
        <span className={styles.line} />
        или
        <span className={styles.line} />
      </div>

      <div className={styles.socials}>
        <button
          type="button"
          onClick={onGoogle}
          disabled={pending}
          className={styles.social}
        >
          Google
        </button>
        {/* Apple ID — вёрстка по эталону, подключение отдельной задачей */}
        <button type="button" className={styles.social}>
          Apple ID
        </button>
      </div>
    </>
  );
}
