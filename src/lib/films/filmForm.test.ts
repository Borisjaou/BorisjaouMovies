import { describe, expect, it } from "vitest";
import {
  checkFilmForm,
  EMPTY_FILM_FORM,
  FILM_FORM_MESSAGES,
  filmFormValuesFromFormData,
  missingText,
  type FilmFormValues,
} from "./filmForm";

const valid: FilmFormValues = {
  ...EMPTY_FILM_FORM,
  title: "Орбита 9",
  year: "2024",
  genres: ["Фантастика", "Драма"],
};

describe("checkFilmForm", () => {
  it("пустая форма — все обязательные поля в порядке эталона", () => {
    const r = checkFilmForm(EMPTY_FILM_FORM);
    expect(r.data).toBeNull();
    expect(r.missing).toEqual(["title", "year", "genres"]);
    expect(missingText(r.missing)).toBe("Заполните обязательные поля: название, год, жанр");
  });

  it("пробелы в названии не считаются", () => {
    expect(checkFilmForm({ ...valid, title: "   " }).missing).toEqual(["title"]);
  });

  it("минимальная форма проходит, пустые необязательные → null", () => {
    const r = checkFilmForm(valid);
    expect(r.data).toEqual({
      title: "Орбита 9",
      originalTitle: null,
      year: 2024,
      durationMin: null,
      genres: ["Фантастика", "Драма"],
      country: null,
      director: null,
      cast: [],
      description: "",
      trailerUrl: null,
      isNew: true,
    });
  });

  it("актёры через запятую, длительность числом", () => {
    const r = checkFilmForm({ ...valid, cast: " Анна Ли,  Марк Ведров ,", durationMin: "128" });
    expect(r.data?.cast).toEqual(["Анна Ли", "Марк Ведров"]);
    expect(r.data?.durationMin).toBe(128);
  });

  it("ошибки формата — текстом под полем", () => {
    const r = checkFilmForm({
      ...valid,
      year: "1700",
      durationMin: "1.5",
      trailerUrl: "youtube",
      description: "а".repeat(601),
    });
    expect(r.data).toBeNull();
    expect(r.missing).toEqual([]);
    expect(r.fieldErrors).toEqual({
      year: FILM_FORM_MESSAGES.year,
      durationMin: FILM_FORM_MESSAGES.duration,
      trailerUrl: FILM_FORM_MESSAGES.trailer,
      description: FILM_FORM_MESSAGES.tooLong(600),
    });
  });

  it("незнакомый жанр отклоняется", () => {
    const r = checkFilmForm({ ...valid, genres: ["Вестерн" as never] });
    expect(r.data).toBeNull();
  });
});

describe("filmFormValuesFromFormData", () => {
  it("собирает жанры, «Новинки» и отбрасывает лишнее", () => {
    const fd = new FormData();
    fd.set("title", "Тихий берег");
    fd.set("year", "2025");
    fd.append("genres", "Драма");
    fd.append("genres", "Вестерн");
    fd.set("isNew", "0");
    const v = filmFormValuesFromFormData(fd);
    expect(v.genres).toEqual(["Драма"]);

    const ordered = new FormData();
    for (const g of ["Фантастика", "Драма", "Фантастика"]) ordered.append("genres", g);
    expect(filmFormValuesFromFormData(ordered).genres).toEqual(["Фантастика", "Драма"]);
    expect(v.isNew).toBe(false);
    expect(v.director).toBe("");
  });
});
