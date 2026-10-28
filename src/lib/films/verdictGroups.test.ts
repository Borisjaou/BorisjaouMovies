import { describe, expect, it } from "vitest";
import { groupByVerdict } from "./verdictGroups";

describe("groupByVerdict", () => {
  it("порядок групп и фильмов внутри, пустые группы пропускаются", () => {
    const films = [
      { id: 1, verdict: null },
      { id: 2, verdict: "disliked" as const },
      { id: 3, verdict: null },
      { id: 4, verdict: "disliked" as const },
    ];
    expect(groupByVerdict(films).map((g) => [g.id, g.films.map((f) => f.id)])).toEqual([
      ["disliked", [2, 4]],
      ["none", [1, 3]],
    ]);
  });
});
