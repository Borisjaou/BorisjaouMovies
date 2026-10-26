"use client";

import { useEffect, useState } from "react";
import { loadFilmsPageAction } from "@/app/actions/films";
import type { Film, FilmPage } from "@/lib/films/types";

interface Loaded {
  key: string;
  items: Film[];
  page: number;
  hasMore: boolean;
}

/**
 * Подгрузка следующих страниц каталога при прокрутке.
 * Внешний вид не меняется: вместо кнопки — невидимая метка в конце сетки.
 * При смене фильтров (`key`) подгруженные страницы сбрасываются.
 */
export function useLoadMore(first: FilmPage, key: string, enabled: boolean) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  const [loadingPage, setLoadingPage] = useState<string | null>(null);

  const current: Loaded =
    loaded && loaded.key === key && loaded.page >= first.page
      ? loaded
      : { key, items: [], page: first.page, hasMore: first.hasMore };

  const nextPage = current.page + 1;
  const requestId = `${key}#${nextPage}`;
  const canLoad = enabled && current.hasMore && loadingPage !== requestId;

  useEffect(() => {
    if (!sentinel || !canLoad) return;
    const { items } = current;

    const observer = new IntersectionObserver(
      (records) => {
        if (!records.some((r) => r.isIntersecting)) return;
        observer.disconnect();
        setLoadingPage(requestId);
        loadFilmsPageAction(key, nextPage)
          // Ответ для устаревших фильтров не мешает: такие страницы отбрасываются по key
          .then((next) => setLoaded({ key, items: [...items, ...next.items], page: next.page, hasMore: next.hasMore }))
          .catch(() => undefined) // сеть или сервер — повтор при следующем появлении метки
          .finally(() => setLoadingPage(null));
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // current.items меняется вместе с requestId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinel, canLoad, requestId, key, nextPage]);

  // Без дублей, если между запросами данные сдвинулись
  const seen = new Set<number>();
  const items = [...first.items, ...current.items].filter((f) => !seen.has(f.id) && seen.add(f.id));

  return { items, total: first.total, hasMore: current.hasMore, attachSentinel: setSentinel };
}
