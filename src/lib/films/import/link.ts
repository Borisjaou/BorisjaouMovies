/** Что за ссылку вставили в форму */
export type FilmLink =
  | { source: "kinopoisk"; id: string }
  | { source: "tmdb"; kind: "movie" | "tv"; id: string }
  | { source: "imdb"; id: string };

export function parseFilmLink(raw: string): FilmLink | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
  const path = url.pathname;

  // kinopoisk.ru/film/326/, kinopoisk.ru/series/464963/, hd.kinopoisk.ru/?…rt=…
  if (host === "kinopoisk.ru" || host.endsWith(".kinopoisk.ru")) {
    const m = path.match(/\/(?:film|series)\/(\d+)/);
    return m ? { source: "kinopoisk", id: m[1] } : null;
  }
  // themoviedb.org/movie/603-the-matrix, themoviedb.org/tv/1396
  if (host === "themoviedb.org") {
    const m = path.match(/\/(movie|tv)\/(\d+)/);
    return m ? { source: "tmdb", kind: m[1] === "tv" ? "tv" : "movie", id: m[2] } : null;
  }
  // imdb.com/title/tt0133093/
  if (host === "imdb.com") {
    const m = path.match(/\/title\/(tt\d+)/);
    return m ? { source: "imdb", id: m[1] } : null;
  }
  return null;
}
