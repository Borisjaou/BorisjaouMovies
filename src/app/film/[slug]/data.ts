import { cache } from "react";
import { getFilmBySlug } from "@/lib/films";

/** Один запрос на рендер: generateMetadata, страница и OG-картинка */
export const loadFilm = cache((slug: string) => getFilmBySlug(slug));
