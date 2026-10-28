import type { IconName } from "@/components/icons";
import type { ShelfId } from "@/lib/films/params";

export type { ShelfId };

export interface ShelfInfo {
  id: ShelfId;
  /** Заголовок раздела и пункт меню */
  title: string;
  /** Подпись в нижнем меню мобилы (там узко) */
  navLabel: string;
  /** Мобильная страница раздела */
  path: string;
  icon: IconName;
  /** Название в кавычках для тостов: «Надо посмотреть» */
  quoted: string;
  emptyTitle: string;
  emptyText: string;
  /** Пустой раздел в каталоге на ПК */
  deskEmptyTitle: string;
  deskEmptyText: string;
  /** Подписи кнопки: добавить / убрать */
  addLabel: string;
  removeLabel: string;
  /** Короткая подпись кнопки на ПК (страница фильма): выключено / включено */
  buttonOff: string;
  buttonOn: string;
}

/** Разделы-списки зрителя. Порядок = порядок в меню: перед «Избранным» */
export const SHELVES: Record<ShelfId, ShelfInfo> = {
  watchlist: {
    id: "watchlist",
    title: "Надо посмотреть",
    navLabel: "Посмотреть",
    path: "/watchlist",
    icon: "bookmark",
    quoted: "«Надо посмотреть»",
    emptyTitle: "Здесь пока пусто",
    emptyText: "Нажмите на закладку у фильма, чтобы отложить его сюда",
    deskEmptyTitle: "В «Надо посмотреть» пока пусто",
    deskEmptyText: "Нажмите на закладку у фильма, чтобы отложить его",
    addLabel: "Добавить в «Надо посмотреть»",
    removeLabel: "Убрать из «Надо посмотреть»",
    buttonOff: "Надо посмотреть",
    buttonOn: "В списке",
  },
  watched: {
    id: "watched",
    title: "Просмотрено",
    navLabel: "Просмотрено",
    path: "/watched",
    icon: "watched",
    quoted: "«Просмотрено»",
    emptyTitle: "Здесь пока пусто",
    emptyText: "Отметьте фильм галочкой, когда посмотрите его",
    deskEmptyTitle: "В «Просмотрено» пока пусто",
    deskEmptyText: "Отметьте фильм галочкой, когда посмотрите его",
    addLabel: "Отметить как просмотренный",
    removeLabel: "Убрать из «Просмотрено»",
    buttonOff: "Просмотрено",
    buttonOn: "Просмотрен",
  },
  favorites: {
    id: "favorites",
    title: "Избранное",
    navLabel: "Избранное",
    path: "/favorites",
    icon: "heart",
    quoted: "избранное",
    emptyTitle: "Здесь пока пусто",
    emptyText: "Нажмите на сердечко у фильма, чтобы сохранить его сюда",
    deskEmptyTitle: "В избранном пока пусто",
    deskEmptyText: "Нажмите на сердечко у фильма, чтобы сохранить его",
    addLabel: "Добавить в избранное",
    removeLabel: "Убрать из избранного",
    buttonOff: "В избранное",
    buttonOn: "В избранном",
  },
};

export const SHELF_ORDER: readonly ShelfId[] = ["watchlist", "watched", "favorites"];

/** Текст тоста после нажатия на кнопку списка */
export function shelfToast(shelf: ShelfId, title: string, added: boolean): string {
  const s = SHELVES[shelf];
  if (shelf === "favorites") return added ? `«${title}» добавлен в избранное` : `«${title}» убран из избранного`;
  return added ? `«${title}» добавлен в ${s.quoted}` : `«${title}» убран из ${s.quoted}`;
}
