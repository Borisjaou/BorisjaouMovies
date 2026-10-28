import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { LIGHT } from "@/lib/palette";
import { loadFilm } from "./data";

export const alt = "Постер фильма — Borisjaou";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fontsDir = join(process.cwd(), "assets/fonts");
const oswald = readFile(join(fontsDir, "Oswald-Bold.ttf"));
const ptMono = readFile(join(fontsDir, "PTMono-Regular.ttf"));

/** OG-картинка в стиле постера со страницы фильма (Movie / DeskMovie, светлая тема) */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const film = await loadFilm((await params).slug);
  if (!film) notFound();

  const titleSize = film.title.length > 18 ? 88 : 120;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background: LIGHT.posters[film.posterColor - 1],
          color: LIGHT.posterInk,
          fontFamily: "PT Mono",
          overflow: "hidden",
        }}
      >
        {/* Фигуры постера: круг справа и арка снизу слева (как в Movie) */}
        <div
          style={{
            position: "absolute",
            width: 560,
            height: 560,
            borderRadius: 280,
            right: -140,
            top: 40,
            background: LIGHT.shape,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 330,
            borderRadius: "110px 110px 0 0",
            left: 700,
            bottom: 0,
            background: LIGHT.shape,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "Oswald", fontSize: 40 }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: LIGHT.accent }} />
          Borisjaou
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", padding: "10px 18px", borderRadius: 16, background: LIGHT.tag, fontSize: 28 }}>
              {`${film.year} · ${film.genres[0]}`}
            </div>
          </div>
          <div style={{ display: "flex", fontFamily: "Oswald", fontSize: titleSize, lineHeight: 1, maxWidth: 1000 }}>
            {film.title}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Oswald", data: await oswald, weight: 700, style: "normal" },
        { name: "PT Mono", data: await ptMono, weight: 400, style: "normal" },
      ],
    },
  );
}
