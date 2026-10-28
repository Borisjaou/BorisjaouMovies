import { IMPORT_MESSAGES, ImportError, type FetchFn, type ImportedFilm } from "./common";
import { importFromKinopoisk } from "./kinopoisk";
import { parseFilmLink } from "./link";
import { findByImdb, importFromTmdb } from "./tmdb";

export { IMPORT_MESSAGES, ImportError, type ImportedFilm } from "./common";
export { parseFilmLink } from "./link";

export interface ImportKeys {
  kinopoisk?: string;
  tmdb?: string;
}

/**
 * Данные фильма по ссылке: Кинопоиск — через kinopoiskapiunofficial.tech,
 * TMDB и IMDb — через API TMDB (IMDb-номер ищется в TMDB).
 */
export async function importFilm(link: string, keys: ImportKeys, fetchFn: FetchFn = fetch): Promise<ImportedFilm> {
  const parsed = parseFilmLink(link);
  if (!parsed) throw new ImportError(IMPORT_MESSAGES.badLink);

  if (parsed.source === "kinopoisk") {
    if (!keys.kinopoisk) throw new ImportError(IMPORT_MESSAGES.noKinopoiskKey);
    return importFromKinopoisk(parsed.id, keys.kinopoisk, fetchFn);
  }

  if (!keys.tmdb) throw new ImportError(IMPORT_MESSAGES.noTmdbKey);
  const target = parsed.source === "imdb" ? await findByImdb(parsed.id, keys.tmdb, fetchFn) : parsed;
  return importFromTmdb(target.kind, target.id, keys.tmdb, fetchFn);
}
