import { describe, expect, it, vi } from "vitest";
import { createSupabaseFileStorage } from "./supabase";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function setup(status = 200) {
  const fetchImpl = vi.fn(async () => new Response("{}", { status }));
  const storage = createSupabaseFileStorage({
    url: "https://abc.supabase.co/",
    serviceKey: "secret",
    bucket: "posters",
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });
  return { storage, fetchImpl };
}

describe("createSupabaseFileStorage", () => {
  it("загружает в bucket и отдаёт публичный адрес", async () => {
    const { storage, fetchImpl } = setup();
    const file = await storage.save({ data: PNG, contentType: "image/png", extension: "png", folder: "posters" });
    expect(file.url).toMatch(/^https:\/\/abc\.supabase\.co\/storage\/v1\/object\/public\/posters\/posters\/[0-9a-f-]{36}\.png$/);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://abc.supabase.co/storage/v1/object/posters/${file.key}`);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secret");
  });

  it("ошибка Supabase — исключение (фильм не сохранится с битым постером)", async () => {
    const { storage } = setup(403);
    await expect(storage.save({ data: PNG, contentType: "image/png", extension: "png", folder: "posters" })).rejects.toThrow(
      /403/,
    );
  });

  it("удаляет только свои файлы", async () => {
    const { storage, fetchImpl } = setup();
    await storage.deleteByUrl("/uploads/posters/old.png");
    expect(fetchImpl).not.toHaveBeenCalled();
    await storage.deleteByUrl("https://abc.supabase.co/storage/v1/object/public/posters/posters/a.png");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://abc.supabase.co/storage/v1/object/posters");
    expect(JSON.parse(String(init.body))).toEqual({ prefixes: ["posters/a.png"] });
  });
});
