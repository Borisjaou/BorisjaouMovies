/**
 * Списки «Надо посмотреть» / «Просмотрено»: import { useWatchList } from "@/lib/watchlists".
 * Реализация — в папке ./watchlists.
 */
export { WatchListsProvider, useWatchList } from "./watchlists/context";
export { WATCH_LISTS, isWatchListId, type WatchEntry, type WatchListApi, type WatchListId } from "./watchlists/types";
