import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { detectImage } from "./image";
import { createLocalFileStorage } from "./local";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);

describe("detectImage", () => {
  it("узнаёт формат по содержимому", () => {
    expect(detectImage(PNG)?.extension).toBe("png");
    expect(detectImage(JPG)?.extension).toBe("jpg");
    expect(detectImage(new TextEncoder().encode("RIFF1234WEBPVP8 "))?.extension).toBe("webp");
  });

  it("текст под видом картинки не проходит", () => {
    expect(detectImage(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImage(new Uint8Array())).toBeNull();
  });
});

describe("createLocalFileStorage", () => {
  const root = mkdtempSync(join(tmpdir(), "borisjaou-uploads-"));
  const storage = createLocalFileStorage(root);
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("сохраняет файл в папку и отдаёт адрес /uploads/…", async () => {
    const file = await storage.save({ data: PNG, contentType: "image/png", extension: "png", folder: "posters" });
    expect(file.url).toMatch(/^\/uploads\/posters\/[0-9a-f-]{36}\.png$/);
    expect(readFileSync(join(root, file.key))).toEqual(Buffer.from(PNG));

    await storage.deleteByUrl(file.url);
    expect(existsSync(join(root, file.key))).toBe(false);
    await expect(storage.deleteByUrl(file.url)).resolves.toBeUndefined(); // повторно — без ошибки
  });

  it("не трогает чужие адреса и не выходит за папку", async () => {
    await expect(storage.deleteByUrl("https://cdn.example.com/a.png")).resolves.toBeUndefined();
    await expect(storage.deleteByUrl("/uploads/../../etc/passwd")).resolves.toBeUndefined();
    await expect(
      storage.save({ data: PNG, contentType: "image/png", extension: "png", folder: "../outside" }),
    ).rejects.toThrow();
  });
});
