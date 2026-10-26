/**
 * Адрес сайта для ссылок «Поделиться», metadataBase и OG.
 * Задаётся в .env: NEXT_PUBLIC_SITE_URL=https://borisjaou.app
 */
const vercelDomain = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

/** Свой домен из NEXT_PUBLIC_SITE_URL; без него на Vercel — основной домен проекта (*.vercel.app) */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || (vercelDomain ? `https://${vercelDomain}` : "https://borisjaou.app")
).replace(/\/+$/, "");

export function filmPath(slug: string): string {
  return `/film/${slug}`;
}

export function filmUrl(slug: string): string {
  return `${SITE_URL}${filmPath(slug)}`;
}

/** Как в поле ссылки эталона: без протокола — borisjaou.app/film/orbita-9 */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

export type ShareTargetId = "telegram" | "whatsapp" | "vk" | "mail";

/** Share-URL сервисов; «Ещё» — navigator.share, отдельно */
export function shareUrls(url: string, title: string): Record<ShareTargetId, string> {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return {
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    vk: `https://vk.com/share.php?url=${u}&title=${t}`,
    mail: `mailto:?subject=${t}&body=${encodeURIComponent(`${title}\n${url}`)}`,
  };
}
