"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Мобильные экраны без десктопной версии (Filters, Favorites):
 * на ≥1024px уводим на каталог, сохраняя searchParams.
 */
export function useDesktopRedirect(buildHref: (search: string) => string): void {
  const router = useRouter();
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const redirect = () => {
      if (mq.matches) router.replace(buildHref(window.location.search));
    };
    redirect();
    mq.addEventListener("change", redirect);
    return () => mq.removeEventListener("change", redirect);
  }, [router, buildHref]);
}
