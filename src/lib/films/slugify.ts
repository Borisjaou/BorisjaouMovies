/** Транслитерация 1:1 из AdminAdd.dc.html / DeskAdminAdd.dc.html (TR) */
const TR: Readonly<Record<string, string>> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export const DEFAULT_SLUG = "novyy-film";

export function slugify(value: string): string {
  const out = value
    .toLowerCase()
    .split("")
    .map((ch) => TR[ch] ?? ch)
    .join("");
  return out.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || DEFAULT_SLUG;
}
