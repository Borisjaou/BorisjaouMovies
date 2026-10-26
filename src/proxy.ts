import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Next 16: бывший middleware.ts. Закрывает /admin/*:
 * без входа — на /login с возвратом, не админ — на главную.
 * Серверные действия админки дополнительно проверяют роль сами.
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (!req.auth) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  if (role !== "admin") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
