/**
 * Светлая палитра из THEMES.light — для мест, где CSS-переменные недоступны
 * (OG-картинки через next/og). Должна совпадать с globals.css.
 */
export const LIGHT = {
  bg: "#FCF3E4",
  ink: "#0D0D0D",
  accent: "#F37925",
  shape: "rgba(255,255,255,0.42)",
  tag: "rgba(255,255,255,0.6)",
  posterInk: "#0D0D0D",
  star: "#E07A1F",
  posters: ["#FAC670", "#91C3CE", "#C0A8E6", "#F38E44", "#F5E1BE", "#EEEBF2"],
} as const;
