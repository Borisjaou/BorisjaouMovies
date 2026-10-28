import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Служебные и личные страницы: админка, API, вход, профиль, избранное, фильтры (дубли каталога)
      disallow: ["/admin", "/api/", "/login", "/profile", "/favorites", "/watchlist", "/watched", "/filters"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
