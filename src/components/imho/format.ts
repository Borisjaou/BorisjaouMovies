/** «28 октября» (в этом году) / «28 октября 2025» */
export function imhoDate(iso: string | null, now = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  const sameYear = d.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(d).replace(/\s*г\.$/, "");
}
