import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaUserRepository } from "@/lib/users/prismaRepository";
import { createTestDb } from "@/test/db";
import { isAdminEmail, safeCallbackUrl } from "./roles";
import { AUTH_MESSAGES, loginSchema, registerSchema } from "./schemas";

const firstError = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, field: string) =>
  r.error?.issues.find((i) => i.path[0] === field)?.message;

describe("isAdminEmail", () => {
  it("по списку из ADMIN_EMAILS, без учёта регистра и пробелов", () => {
    const list = " Boss@Mail.ru , editor@mail.ru ,";
    expect(isAdminEmail("boss@mail.ru", list)).toBe(true);
    expect(isAdminEmail("EDITOR@mail.ru ", list)).toBe(true);
    expect(isAdminEmail("user@mail.ru", list)).toBe(false);
    expect(isAdminEmail("", "")).toBe(false);
  });
});

describe("safeCallbackUrl", () => {
  it("пропускает только относительные пути сайта", () => {
    expect(safeCallbackUrl("/admin/films?x=1")).toBe("/admin/films?x=1");
    expect(safeCallbackUrl(undefined)).toBe("/");
    expect(safeCallbackUrl("https://evil.com")).toBe("/");
    expect(safeCallbackUrl("//evil.com")).toBe("/");
    expect(safeCallbackUrl("/\\evil.com")).toBe("/");
  });
});

describe("схемы", () => {
  it("вход: пустые поля", () => {
    const r = loginSchema.safeParse({ email: "", password: "" });
    expect(firstError(r, "email")).toBe(AUTH_MESSAGES.emailRequired);
    expect(firstError(r, "password")).toBe(AUTH_MESSAGES.passwordRequired);
  });

  it("вход: неверный формат почты, почта приводится к нижнему регистру", () => {
    expect(firstError(loginSchema.safeParse({ email: "abc", password: "x" }), "email")).toBe(AUTH_MESSAGES.emailInvalid);
    const ok = loginSchema.safeParse({ email: " Name@Mail.RU ", password: "x" });
    expect(ok.success && ok.data.email).toBe("name@mail.ru");
  });

  it("регистрация: имя и длина пароля", () => {
    const r = registerSchema.safeParse({ name: "  ", email: "a@b.ru", password: "1234567" });
    expect(firstError(r, "name")).toBe(AUTH_MESSAGES.nameRequired);
    expect(firstError(r, "password")).toBe(AUTH_MESSAGES.passwordShort);
    expect(firstError(registerSchema.safeParse({ name: "А", email: "a@b.ru", password: "x".repeat(73) }), "password")).toBe(
      AUTH_MESSAGES.passwordLong,
    );
    expect(registerSchema.safeParse({ name: "Борис", email: "a@b.ru", password: "12345678" }).success).toBe(true);
  });
});

describe("createPrismaUserRepository", () => {
  let db: PrismaClient;
  let cleanup: () => Promise<void>;
  beforeAll(async () => {
    ({ db, cleanup } = await createTestDb({ seed: false }));
  });
  afterAll(() => cleanup());

  it("создаёт, находит, обновляет; не даёт занять почту дважды, в том числе параллельно", async () => {
    const repo = createPrismaUserRepository(db);
    const base = { name: "Б", passwordHash: "h", role: "user" as const, providers: ["credentials" as const] };

    const results = await Promise.allSettled([
      repo.create({ ...base, email: "a@b.ru" }),
      repo.create({ ...base, email: "A@b.ru" }),
      repo.create({ ...base, email: "c@d.ru" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    const rejected = results.find((r) => r.status === "rejected");
    expect(rejected?.status === "rejected" && (rejected.reason as Error).message).toBe("EMAIL_TAKEN");

    const a = await repo.findByEmail("A@B.ru");
    expect(a).toMatchObject({ email: "a@b.ru", role: "user", providers: ["credentials"] });
    expect(a && (await repo.findById(a.id))?.email).toBe("a@b.ru");

    const updated = a && (await repo.update(a.id, { role: "admin", providers: ["credentials", "google"] }));
    expect(updated).toMatchObject({ role: "admin", providers: ["credentials", "google"] });
    expect(await db.user.count()).toBe(2);
    expect(await repo.findByEmail("none@x.ru")).toBeNull();
  });

  it("аккаунт только с Google — без пароля", async () => {
    const repo = createPrismaUserRepository(db);
    const g = await repo.create({ email: "g@x.ru", name: "G", passwordHash: null, role: "user", providers: ["google"] });
    expect(g.providers).toEqual(["google"]);
  });
});
