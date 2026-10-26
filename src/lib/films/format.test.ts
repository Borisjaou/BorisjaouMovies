import { describe, expect, it } from "vitest";
import { FILMS } from "./data";
import { filmMeta, formatDuration, formatRating } from "./format";

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
  it("год · жанр · рейтинг", () => {
    const orbita = FILMS.find((f) => f.slug === "orbita-9");
    expect(orbita && filmMeta(orbita)).toBe("2024 · Фантастика · 8.4");
    expect(formatRating(8)).toBe("8.0");
  });

  it("без рейтинга — без третьей части", () => {
    const draft = FILMS.find((f) => f.status === "draft");
    expect(draft && filmMeta(draft)).toBe("2026 · Драма");
  });
});
