import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Oswald, PT_Mono } from "next/font/google";
import { auth } from "@/auth";
import { Providers } from "@/components/Providers/Providers";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const display = Oswald({
  // 700 — заголовки; 500 — подписи с весом 400 внутри заголовков (эталон подключает Oswald 500/600/700)
  weight: ["500", "700"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});

const body = PT_Mono({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

const DESCRIPTION = "Каталог фильмов: поиск, фильтры по жанрам и годам, избранное и ссылки, чтобы делиться с друзьями.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Borisjaou — каталог фильмов", template: "%s — Borisjaou" },
  description: DESCRIPTION,
  applicationName: "Borisjaou",
  openGraph: {
    type: "website",
    siteName: "Borisjaou",
    locale: "ru_RU",
    title: "Borisjaou — каталог фильмов",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCF3E4" },
    { media: "(prefers-color-scheme: dark)", color: "#1B1A19" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await auth();
  return (
    // suppressHydrationWarning: next-themes ставит data-theme до гидрации
    <html lang="ru" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
