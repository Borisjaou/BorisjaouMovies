import { prisma } from "@/lib/db";

/**
 * Ежедневный запрос к базе (Vercel Cron, vercel.json → crons), чтобы бесплатный
 * проект Supabase не уходил на паузу после недели без активности.
 * Если в Vercel задан CRON_SECRET, Vercel присылает его в заголовке — тогда чужие вызовы отклоняются.
 */
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  try {
    const films = await prisma.film.count();
    return Response.json({ ok: true, films }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("keepalive", error);
    return Response.json({ ok: false }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
