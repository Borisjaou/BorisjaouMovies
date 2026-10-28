import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: { film: { count: vi.fn(async () => 11) } } }));

const { GET } = await import("./route");

describe("GET /api/keepalive", () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("делает запрос к базе", async () => {
    const res = await GET(new Request("http://x/api/keepalive"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, films: 11 });
  });

  it("с CRON_SECRET пускает только Vercel Cron", async () => {
    process.env.CRON_SECRET = "s3cret";
    expect((await GET(new Request("http://x/api/keepalive"))).status).toBe(401);
    const ok = await GET(new Request("http://x/api/keepalive", { headers: { authorization: "Bearer s3cret" } }));
    expect(ok.status).toBe(200);
  });
});
