"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { saveFilmAction, type SavedFilm, type SaveFilmResult } from "@/app/admin/films/actions";
import { Icon } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { Chip } from "@/components/ui/Chip";
import { errorId, Field } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import inputStyles from "@/components/ui/Input.module.scss";
import { Segmented } from "@/components/ui/Segmented";
import { cx } from "@/lib/cx";
import { AGE_RATINGS, COUNTRIES, FILM_LINK_BASE, FILTER_GENRES, GENRES, type Genre } from "@/lib/films/constants";
import {
  checkFilmForm,
  DESCRIPTION_MAX,
  EMPTY_FILM_FORM,
  missingText,
  YEAR_MAX,
  YEAR_MIN,
  type FilmFormField,
  type FilmFormValues,
  type RequiredField,
} from "@/lib/films/filmForm";
import { slugify } from "@/lib/films/slugify";
import { detectImage, POSTER_ERROR, POSTER_MAX_BYTES, POSTER_TYPES } from "@/lib/storage/image";
import { AdminHeader } from "./AdminHeader";
import { SuccessDialog } from "./SuccessDialog";
import styles from "./FilmForm.module.scss";

const DESKTOP_QUERY = "(min-width: 1024px)";

type Layout = "f" | "d"; // префиксы id как в эталоне: f-… (AdminAdd), d-… (DeskAdminAdd)
type TextField = Exclude<FilmFormField, "genres" | "ageRating" | "isNew">;
type ErrorKey = FilmFormField | "poster";

export interface FilmFormProps {
  /** undefined — новый фильм */
  filmId?: number;
  /** Ссылка существующего фильма (не меняется при редактировании) */
  slug?: string;
  initialValues?: FilmFormValues;
  initialPosterUrl?: string | null;
  heading: string;
}

function without<T extends object>(obj: T, key: PropertyKey): T {
  const next = { ...obj };
  delete next[key as keyof T];
  return next;
}

interface Poster {
  file: File | null;
  url: string | null;
}

/** Добавление / редактирование фильма: AdminAdd (мобила) и DeskAdminAdd (ПК) */
export function FilmForm({ filmId, slug: fixedSlug, initialValues, initialPosterUrl = null, heading }: FilmFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<FilmFormValues>(initialValues ?? EMPTY_FILM_FORM);
  const [poster, setPoster] = useState<Poster>({ file: null, url: initialPosterUrl });
  const [tried, setTried] = useState(false);
  const [serverErrors, setServerErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedFilm | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Ссылка на локальный файл освобождается при замене постера и при уходе со страницы
  useEffect(() => {
    const url = poster.url;
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [poster.url]);

  const check = checkFilmForm(values);
  const missing: readonly RequiredField[] = tried ? check.missing : [];
  const errors: Partial<Record<ErrorKey, string>> = { ...(tried ? check.fieldErrors : {}), ...serverErrors };
  const isMissing = (f: RequiredField) => missing.includes(f);

  const set = <K extends keyof FilmFormValues>(key: K, value: FilmFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (serverErrors[key]) setServerErrors((e) => without(e, key));
  };
  const onText = (key: TextField) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    set(key, e.target.value);
  // Новый фильм: жанры в порядке справочника, как picked в эталоне.
  // Правка: порядок фильма сохраняется (первый жанр виден в карточке), новые — в конец.
  const toggleGenre = (g: Genre) => {
    const on = values.genres.includes(g);
    if (on) set("genres", values.genres.filter((x) => x !== g));
    else set("genres", filmId ? [...values.genres, g] : GENRES.filter((x) => x === g || values.genres.includes(x)));
  };

  const pickPoster = async (file: File | undefined) => {
    if (!file) return;
    // Та же проверка, что на сервере: размер и формат по содержимому файла
    const kind = file.size <= POSTER_MAX_BYTES ? detectImage(new Uint8Array(await file.slice(0, 12).arrayBuffer())) : null;
    if (!kind || !POSTER_TYPES.includes(kind.extension)) {
      setServerErrors((e) => ({ ...e, poster: POSTER_ERROR }));
      return;
    }
    setServerErrors((e) => without(e, "poster"));
    setPoster({ file, url: URL.createObjectURL(file) });
  };

  // ---- Живая карточка «Как увидят зрители» ----
  const slug = fixedSlug ?? slugify(values.title);
  const duration = /^\d+$/.test(values.durationMin.trim()) ? Number(values.durationMin) : 0;
  const metaParts = [
    values.year.trim() || "Год",
    values.genres.length ? values.genres.slice(0, 2).join(", ") : "Жанр",
    values.ageRating,
  ];
  if (duration) metaParts.push(`${Math.floor(duration / 60)} ч ${duration % 60} мин`);
  const preview = {
    title: values.title.trim() || "Название фильма",
    meta: metaParts.filter(Boolean).join(" · "),
    desc: values.description.trim() || "Здесь появится описание фильма.",
    link: `${FILM_LINK_BASE}${slug}`,
  };

  // Жанры формы (10, как в эталоне) + жанры фильма вне этого списка, чтобы их можно было снять
  const genreOptions = [...FILTER_GENRES, ...values.genres.filter((g) => !FILTER_GENRES.includes(g))];

  // ---- Отправка ----
  const focusFirstProblem = (problems: readonly ErrorKey[]) => {
    const layout: Layout = window.matchMedia(DESKTOP_QUERY).matches ? "d" : "f";
    const order: readonly [ErrorKey, string][] = [
      ["title", "title"],
      ["year", "year"],
      ["durationMin", "dur"],
      ["genres", "genres"],
      ["country", "country"],
      ["director", "dir"],
      ["cast", "cast"],
      ["description", "desc"],
      ["trailerUrl", "trailer"],
      ["originalTitle", "orig"],
      ["poster", "poster"],
    ];
    const first = order.find(([key]) => problems.includes(key));
    const el = first && document.getElementById(`${layout}-${first[1]}`);
    if (!el) return;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      el.focus();
    } else {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  const applyResult = (result: SaveFilmResult) => {
    if (result.ok) {
      setSaved(result.film);
      router.refresh();
      return;
    }
    setFormError(result.formError ?? null);
    setServerErrors(result.fieldErrors);
    focusFirstProblem([...result.missing, ...(Object.keys(result.fieldErrors) as ErrorKey[])]);
  };

  const submit = (intent: "draft" | "publish") => {
    setTried(true);
    setFormError(null);
    const problems: ErrorKey[] = [...check.missing, ...(Object.keys(check.fieldErrors) as ErrorKey[])];
    if (serverErrors.poster) problems.push("poster");
    if (problems.length) {
      focusFirstProblem(problems);
      return;
    }

    const fd = new FormData();
    fd.set("intent", intent);
    fd.set("id", filmId ? String(filmId) : "");
    const texts: readonly TextField[] = [
      "title",
      "originalTitle",
      "year",
      "durationMin",
      "country",
      "director",
      "cast",
      "description",
      "trailerUrl",
    ];
    for (const key of texts) fd.set(key, values[key]);
    for (const g of values.genres) fd.append("genres", g);
    fd.set("ageRating", values.ageRating);
    fd.set("isNew", values.isNew ? "1" : "0");
    if (poster.file) fd.set("poster", poster.file);

    startTransition(async () => {
      try {
        applyResult(await saveFilmAction(fd));
      } catch {
        setFormError("Не удалось сохранить фильм. Проверьте соединение и попробуйте ещё раз");
      }
    });
  };

  const addAnother = () => {
    if (filmId) {
      router.push("/admin/films/new");
      return;
    }
    setValues(EMPTY_FILM_FORM);
    setPoster({ file: null, url: null });
    setTried(false);
    setServerErrors({});
    setFormError(null);
    setSaved(null);
    window.scrollTo({ top: 0 });
  };

  // ---- Поля (одинаковые для обеих раскладок, отличаются id и оформлением) ----
  const input = (p: Layout) => cx(inputStyles.input, inputStyles.md, p === "d" && styles.dInput);

  const textField = (
    p: Layout,
    key: TextField,
    idPart: string,
    label: string,
    extra: { placeholder: string; type?: "text" | "number" | "url"; required?: RequiredField; min?: number; max?: number },
  ) => {
    const id = `${p}-${idPart}`;
    const error = errors[key];
    const invalid = extra.required ? isMissing(extra.required) : false;
    return (
      <Field id={id} label={label} error={error} invalid={invalid}>
        <input
          id={id}
          type={extra.type ?? "text"}
          inputMode={extra.type === "number" ? "numeric" : undefined}
          min={extra.min}
          max={extra.max}
          value={values[key]}
          onChange={onText(key)}
          placeholder={extra.placeholder}
          aria-invalid={Boolean(error) || invalid}
          aria-describedby={errorId(id, error)}
          className={input(p)}
        />
      </Field>
    );
  };

  const title = (p: Layout) =>
    textField(p, "title", "title", "Название *", { placeholder: "Например, «Орбита 9»", required: "title" });
  const originalTitle = (p: Layout) =>
    textField(p, "originalTitle", "orig", "Оригинальное название", { placeholder: "Если отличается" });
  const year = (p: Layout) =>
    textField(p, "year", "year", "Год *", {
      placeholder: "2026",
      type: "number",
      min: YEAR_MIN,
      max: YEAR_MAX,
      required: "year",
    });
  const duration_ = (p: Layout) =>
    textField(p, "durationMin", "dur", "Длительность, мин", { placeholder: "120", type: "number", min: 1 });
  const director = (p: Layout) => textField(p, "director", "dir", "Режиссёр", { placeholder: "Имя и фамилия" });
  const cast = (p: Layout) => textField(p, "cast", "cast", "В ролях", { placeholder: "Через запятую" });
  const trailer = (p: Layout) =>
    textField(p, "trailerUrl", "trailer", "Ссылка на трейлер", { placeholder: "https://", type: "url" });

  const country = (p: Layout) => {
    const id = `${p}-country`;
    return (
      <Field id={id} label="Страна" error={errors.country}>
        <select id={id} value={values.country} onChange={onText("country")} className={input(p)}>
          <option value="">Не указана</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          {values.country && !COUNTRIES.some((c) => c === values.country) && (
            <option value={values.country}>{values.country}</option>
          )}
        </select>
      </Field>
    );
  };

  const description = (p: Layout) => {
    const id = `${p}-desc`;
    const error = errors.description;
    return (
      <Field
        id={id}
        label="Описание"
        error={error}
        aside={
          <span className={styles.counter}>
            {values.description.length} / {DESCRIPTION_MAX}
          </span>
        }
      >
        <textarea
          id={id}
          rows={4}
          maxLength={DESCRIPTION_MAX}
          value={values.description}
          onChange={onText("description")}
          placeholder={
            p === "d"
              ? "2–3 предложения о сюжете без спойлеров. Показывается в карточке и на странице фильма."
              : "2–3 предложения о сюжете без спойлеров"
          }
          aria-invalid={Boolean(error)}
          aria-describedby={errorId(id, error)}
          className={cx(inputStyles.input, styles.textarea, p === "d" && styles.dInput)}
        />
      </Field>
    );
  };

  const genresHeading = (p: Layout) => (
    <h2 id={`${p}-genres`} className={p === "d" ? styles.dH2 : styles.mH2} tabIndex={-1}>
      Жанры *{" "}
      <span className={cx(styles.genreHint, isMissing("genres") && styles.genreHintErr)}>— минимум один</span>
    </h2>
  );

  const genreChips = (p: Layout) => (
    <div role="group" aria-label="Жанры" className={styles.chips}>
      {genreOptions.map((g) => (
        <Chip
          key={g}
          label={g}
          on={values.genres.includes(g)}
          onClick={() => toggleGenre(g)}
          check
          size={p === "d" ? "md" : "sm"}
          className={p === "d" ? styles.dChip : undefined}
        />
      ))}
    </div>
  );

  const ages = (p: Layout) => (
    <Segmented
      options={AGE_RATINGS.map((a) => ({ id: a, label: a }))}
      value={values.ageRating || null}
      onChange={(a) => set("ageRating", a)}
      ariaLabel="Возрастной рейтинг"
      itemHeight={p === "d" ? 40 : 42}
      fontSize={14}
      className={p === "d" ? styles.dAges : undefined}
    />
  );

  const posterBox = (p: Layout) => {
    const id = `${p}-poster`;
    const desktop = p === "d";
    return (
      <>
        <label
          htmlFor={id}
          className={cx(styles.poster, desktop ? styles.dPoster : styles.mPoster, dragOver && desktop && styles.dragOver)}
          {...(desktop && {
            onDragOver: (e: DragEvent<HTMLLabelElement>) => {
              e.preventDefault();
              setDragOver(true);
            },
            onDragLeave: () => setDragOver(false),
            onDrop: (e: DragEvent<HTMLLabelElement>) => {
              e.preventDefault();
              setDragOver(false);
              void pickPoster(e.dataTransfer.files[0]);
            },
          })}
        >
          {poster.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- локальный файл (blob:) или адрес из хранилища
            <img src={poster.url} alt="Постер фильма" className={styles.posterImg} />
          ) : (
            <>
              <div aria-hidden="true" className={styles.posterShape} />
              <Icon name="upload" size={desktop ? 28 : 26} className={styles.posterIcon} />
              <span className={styles.posterTitle}>Загрузить постер</span>
              <span className={styles.posterHint}>
                {desktop ? "Перетащите файл или нажмите · JPG, PNG · 2:3" : "JPG, PNG · 2:3"}
              </span>
            </>
          )}
        </label>
        <input
          id={id}
          type="file"
          accept="image/*"
          onChange={(e) => {
            void pickPoster(e.target.files?.[0]);
            e.target.value = ""; // тот же файл можно выбрать снова
          }}
          aria-invalid={Boolean(errors.poster)}
          aria-describedby={errorId(id, errors.poster)}
          className="visually-hidden"
        />
      </>
    );
  };

  const posterError = (p: Layout) =>
    errors.poster && (
      <p id={`${p}-poster-error`} className={styles.posterError}>
        {errors.poster}
      </p>
    );

  const isNewBox = (p: Layout) => (
    <label className={cx(styles.check, p === "d" && styles.dCheck)}>
      <input
        type="checkbox"
        checked={values.isNew}
        onChange={(e) => set("isNew", e.target.checked)}
        className={styles.checkbox}
      />
      {p === "d" ? (
        <span className={styles.checkTitle}>Показать в «Новинках»</span>
      ) : (
        <span className={styles.checkText}>
          <span className={styles.checkTitle}>Показать в «Новинках»</span>
          <span className={styles.checkHint}>Карточка появится в ленте на главной</span>
        </span>
      )}
    </label>
  );

  const buttons = (className: string) => (
    <div className={className}>
      <button type="button" onClick={() => submit("draft")} disabled={pending} className={styles.draftBtn}>
        В черновик
      </button>
      <button type="button" onClick={() => submit("publish")} disabled={pending} className={styles.publishBtn}>
        Опубликовать
      </button>
    </div>
  );

  const alert: ReactNode = (
    <>
      {missing.length > 0 && <FormAlert message={missingText(missing)} />}
      <FormAlert message={formError} />
    </>
  );

  return (
    <div className={styles.page} aria-busy={pending}>
      {/* ================= Мобила: AdminAdd ================= */}
      <div className={cx(styles.mobile, "only-mobile")}>
        <header className={styles.mHeader}>
          <Link href="/admin/films" aria-label="Назад к списку фильмов" className={styles.mBack}>
            <Icon name="back" size={20} />
          </Link>
          <h1 className={styles.mTitle}>{heading}</h1>
          <ThemeToggle />
        </header>

        <main className={styles.mMain}>
          {alert}
          <section className={styles.mTopSection}>
            {posterBox("f")}
            <div className={styles.mPreview}>
              <div className={styles.previewLabel}>Как увидят зрители</div>
              <div className={styles.previewTitle}>{preview.title}</div>
              <div className={styles.previewMeta}>{preview.meta}</div>
              <p className={styles.previewDesc}>{preview.desc}</p>
              <div className={styles.previewLink}>{preview.link}</div>
            </div>
          </section>
          {posterError("f")}

          <section className={styles.mSection}>
            <h2 className={styles.mH2}>Основное</h2>
            {title("f")}
            {originalTitle("f")}
            <div className={styles.pair}>
              {year("f")}
              {duration_("f")}
            </div>
          </section>

          <section className={cx(styles.mSection, styles.gap12)}>
            {genresHeading("f")}
            {genreChips("f")}
          </section>

          <section className={cx(styles.mSection, styles.gap12)}>
            <h2 className={styles.mH2}>Возрастной рейтинг</h2>
            {ages("f")}
          </section>

          <section className={styles.mSection}>
            <h2 className={styles.mH2}>Детали</h2>
            {country("f")}
            {director("f")}
            {cast("f")}
            {description("f")}
            {trailer("f")}
          </section>

          <section className={cx(styles.mSection, styles.gap12)}>
            <h2 className={styles.mH2}>Публикация</h2>
            {isNewBox("f")}
          </section>
        </main>

        {buttons(styles.mFooter)}
      </div>

      {/* ================= ПК: DeskAdminAdd ================= */}
      <AdminHeader crumbs={[{ label: "Фильмы", href: "/admin/films" }, { label: heading }]} />
      <div className={cx(styles.desktop, "only-desktop")}>
        <main className={styles.dMain}>
          <h1 className={styles.dTitle}>{heading}</h1>
          {alert}
          <section className={styles.card}>
            <h2 className={styles.dH2}>Основное</h2>
            <div className={styles.grid}>
              {title("d")}
              {originalTitle("d")}
              {year("d")}
              {duration_("d")}
            </div>
            {description("d")}
          </section>

          <section className={styles.card}>
            {genresHeading("d")}
            {genreChips("d")}
            <div className={styles.dAgeBlock}>
              <div className={styles.dAgeLabel}>Возрастной рейтинг</div>
              {ages("d")}
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.dH2}>Детали</h2>
            <div className={styles.grid}>
              {country("d")}
              {director("d")}
              {cast("d")}
              {trailer("d")}
            </div>
          </section>
        </main>

        <aside className={styles.aside}>
          <div className={styles.previewCard}>
            <div className={styles.previewLabel}>Как увидят зрители</div>
            {posterBox("d")}
            {posterError("d")}
            <div className={styles.dPreviewText}>
              <div className={styles.previewTitle}>{preview.title}</div>
              <div className={styles.previewMeta}>{preview.meta}</div>
              <p className={styles.previewDesc}>{preview.desc}</p>
              <div className={styles.previewLink}>{preview.link}</div>
            </div>
          </div>
          {isNewBox("d")}
          {buttons(styles.dButtons)}
        </aside>
      </div>

      {saved && <SuccessDialog film={saved} onAddAnother={addAnother} />}
    </div>
  );
}
