import { describe, expect, it } from "vitest";
import { FILMS } from "./data";
import { filmMeta, formatDuration } from "./format";

describe("formatDuration", () => {
  it("как на странице фильма: 128 → «2 ч 08 мин»", () => {
    expect(formatDuration(128)).toBe("2 ч 08 мин");
    expect(formatDuration(120)).toBe("2 ч 00 мин");
    expect(formatDuration(95)).toBe("1 ч 35 мин");
  });

  it("меньше часа — только минуты", () => {
    expect(formatDuration(45)).toBe("45 мин");
  });
});

describe("filmMeta", () => {
  it("год · жанр (рейтинг убран с сайта)", () => {
    const orbita = FILMS.find((f) => f.slug === "orbita-9");
    expect(orbita && filmMeta(orbita)).toBe("2024 · Фантастика");
  });
});
