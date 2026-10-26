import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SOURCE, TARGET, toSqlite } from "./prisma-sync-sqlite.mjs";

describe("prisma/sqlite/schema.prisma", () => {
  it("совпадает с основной схемой (после изменения схемы — npm run db:sync)", () => {
    expect(readFileSync(TARGET, "utf8")).toBe(toSqlite(readFileSync(SOURCE, "utf8")));
  });
});
