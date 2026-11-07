import { describe, it, expect } from "vitest";
import {
  setTargets,
  withTargets,
  formatTargets,
  repsLowerBound,
  toTimedTargets,
  toRepTargets,
} from "./planTargets";

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
    [[{ reps: "", seconds: 45 }, { reps: "", seconds: 45 }, { reps: "", seconds: 45 }], "3 × 0:45"],
    [[{ reps: "", seconds: 60, weightKg: 10 }, { reps: "", seconds: 45, weightKg: 10 }], "1:00/0:45 · 10 kg"],
  ])("%j -> %s", (targets, text) => expect(formatTargets(targets)).toBe(text));
});

describe("toTimedTargets / toRepTargets", () => {
  it("gives each set a time, reading older \"30 s\" reps as one, and keeps weights", () => {
    expect(toTimedTargets([{ reps: "30 s" }, { reps: "10", weightKg: 5 }, { reps: "1:15" }])).toEqual([
      { reps: "", seconds: 30 },
      { reps: "", seconds: 30, weightKg: 5 },
      { reps: "", seconds: 75 },
    ]);
  });
  it("keeps a time a set already has", () => {
    expect(toTimedTargets([{ reps: "", seconds: 50 }])).toEqual([{ reps: "", seconds: 50 }]);
  });
  it("switches back to 10 reps a set, dropping the time and keeping weights", () => {
    expect(toRepTargets([{ reps: "", seconds: 45, weightKg: 8 }, { reps: "", seconds: 45 }])).toEqual([
      { reps: "10", weightKg: 8 },
      { reps: "10" },
    ]);
  });
});

describe("repsLowerBound", () => {
  it.each([["8-10", 8], ["12", 12], [" 6 ", 6], ["AMRAP", null], ["", null]])("%s -> %s", (reps, n) =>
    expect(repsLowerBound(reps)).toBe(n));
});
