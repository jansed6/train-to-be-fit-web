import { describe, it, expect } from "vitest";
import { setTargets, withTargets, formatTargets, repsLowerBound } from "./planTargets";

describe("setTargets", () => {
  it("expands a legacy exercise into identical sets", () => {
    expect(setTargets({ sets: 3, reps: "8-10" })).toEqual([{ reps: "8-10" }, { reps: "8-10" }, { reps: "8-10" }]);
  });
  it("prefers explicit targets", () => {
    const targets = [{ reps: "12", weightKg: 20 }, { reps: "10", weightKg: 25 }];
    expect(setTargets({ sets: 3, reps: "10", targets })).toEqual(targets);
  });
  it("never returns fewer than one set", () => {
    expect(setTargets({ sets: 0, reps: "10" })).toEqual([{ reps: "10" }]);
  });
});

describe("withTargets", () => {
  it("keeps the legacy sets/reps in sync", () => {
    expect(withTargets([{ reps: "12", weightKg: 20 }, { reps: "10" }]))
      .toEqual({ targets: [{ reps: "12", weightKg: 20 }, { reps: "10" }], sets: 2, reps: "12" });
  });
});

describe("formatTargets", () => {
  it.each([
    [[{ reps: "10", weightKg: 25 }, { reps: "10", weightKg: 25 }, { reps: "10", weightKg: 25 }], "3 × 10 · 25 kg"],
    [[{ reps: "12", weightKg: 20 }, { reps: "10", weightKg: 25 }, { reps: "8", weightKg: 27.5 }], "12/10/8 · 20–27.5 kg"],
    [[{ reps: "8-10" }, { reps: "8-10" }], "2 × 8-10"],
    [[{ reps: "" }], "1 × —"],
    [[], "—"],
  ])("%j -> %s", (targets, text) => expect(formatTargets(targets)).toBe(text));
});

describe("repsLowerBound", () => {
  it.each([["8-10", 8], ["12", 12], [" 6 ", 6], ["AMRAP", null], ["", null]])("%s -> %s", (reps, n) =>
    expect(repsLowerBound(reps)).toBe(n));
});
