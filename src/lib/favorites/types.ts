/** Запись избранного: id фильма + когда добавлен (для сортировки «Недавние») */
export interface FavoriteEntry {
  filmId: number;
  /** Unix-время в мс */
  addedAt: number;
}

/**
 * Хранилище избранного. Сейчас — localStorage, потом — API сервера.
 * Компоненты с ним не работают напрямую: только через useFavorites().
 */
export interface FavoritesStorage {
  load(): Promise<FavoriteEntry[]>;
  add(entry: FavoriteEntry): Promise<void>;
  remove(filmId: number): Promise<void>;
  /** Очистить (гостевое хранилище после переноса в аккаунт) */
  clear?(): Promise<void>;
  /** Изменения извне (другая вкладка, другое устройство). Возвращает отписку. */
  subscribe?(onChange: (entries: FavoriteEntry[]) => void): () => void;
}

/** Публичный интерфейс для компонентов */
export interface FavoritesApi {
  /** false, пока список не загружен (SSR и первый кадр после гидрации) */
  ready: boolean;
  entries: readonly FavoriteEntry[];
  count: number;
  has(filmId: number): boolean;
  add(filmId: number): void;
  remove(filmId: number): void;
  /** Оптимистично переключает; возвращает новое состояние: true — добавлен */
  toggle(filmId: number): boolean;
}
