import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";
import { expect, type Page, type TestInfo } from "@playwright/test";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

/** Администратор e2e: его почта передаётся серверу в ADMIN_EMAILS (playwright.config.ts) */
export const E2E_ADMIN_EMAIL = "admin@e2e.test";

export const isDesktop = (testInfo: TestInfo) => testInfo.project.name === "desktop";

/** Уникальный адрес для каждого запуска — база общая для всех тестов */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.test`;
}

/** База e2e (playwright.config.ts → DATABASE_URL) */
const E2E_DB = resolve("data/e2e.db");

/**
 * Обычный пользователь — сразу в базе: регистрация на сайте закрыта (только для ADMIN_EMAILS).
 */
export function createUser(email: string, password = "password123", name = "Тестовый зритель"): void {
  const db = new Database(E2E_DB);
  try {
    db.prepare('INSERT INTO "User" ("id", "email", "name", "passwordHash", "role") VALUES (?, ?, ?, ?, ?)').run(
      `e2e-${randomUUID()}`,
      email.toLowerCase(),
      name,
      bcrypt.hashSync(password, 4),
      "user",
    );
  } finally {
    db.close();
  }
}

/** Создать обычного пользователя и войти (вместо закрытой регистрации) */
export async function register(page: Page, email: string, password = "password123", callbackUrl = "/") {
  createUser(email, password);
  await login(page, email, password, callbackUrl);
  await expect(page).not.toHaveURL(/\/login/);
}

/** Форма регистрации по прямой ссылке — работает только для почты из ADMIN_EMAILS */
export async function registerViaForm(page: Page, email: string, password = "password123", callbackUrl = "/") {
  await page.goto(`/login?mode=register&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.getByLabel("Имя").fill("Тестовый зритель");
  await page.getByLabel("Эл. почта").fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function login(page: Page, email: string, password: string, callbackUrl = "/") {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.getByLabel("Эл. почта").fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
}

/** Видимые карточки каталога (у мобилы и ПК одна сетка) */
export function catalogCards(page: Page) {
  return page.locator('main [class*="FilmCard_card"]:visible');
}

/** Настоящий PNG заданного размера (сплошной цвет) — для загрузки постера */
export function pngBuffer(width = 20, height = 30): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8 бит, RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, 0x55)]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
