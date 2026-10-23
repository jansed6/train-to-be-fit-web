import { describe, it, expect } from "vitest";
import {
  prefilledRows,
  buildSession,
  uncheckedSetCount,
  type WeightsByKey,
} from "./workoutRows";
import { setTargets } from "./planTargets";
import type { Exercise } from "./types";

const weights: WeightsByKey = new Map([["id:squat", [80, 85]]]);

describe("prefilledRows", () => {
  it("prefills the trainer's per-set targets over last time's weights", () => {
    const rows = prefilledRows({ name: "Squat", catalogId: "squat", sets: 2, reps: "5",
      targets: [{ reps: "8-10", weightKg: 60 }, { reps: "6", weightKg: 62.5 }] }, weights);
    expect(rows).toEqual([
      { weight: "60", reps: "8", done: false, prefilled: true },
      { weight: "62.5", reps: "6", done: false, prefilled: true },
    ]);
  });
  it("falls back to last time's weights when a set has no weight target", () => {
    const rows = prefilledRows({ name: "Squat", catalogId: "squat", sets: 2, reps: "5" }, weights);
    expect(rows.map((r) => r.weight)).toEqual(["80", "85"]);
  });
  it("leaves reps empty when the target has no number", () => {
    expect(prefilledRows({ name: "Plank", sets: 1, reps: "AMRAP" }, new Map())[0].reps).toBe("");
  });
});

describe("buildSession", () => {
  const planned: Exercise[] = [
    { id: "p1", name: "Squat", catalogId: "squat", sets: 2, reps: "10", targets: [{ reps: "10", weightKg: 30 }, { reps: "10", weightKg: 30 }] },
    { id: "p2", name: "Lunge", sets: 3, reps: "12" },
    { id: "p3", name: "Row", sets: 1, reps: "10" },
  ];
  const row = (weight: string, reps: string, done: boolean) => ({ weight, reps, done, prefilled: false });
  const base = { id: "s1", planId: "plan", dayId: "day", planDayName: "Day B", startedAt: 1000, finishedAt: 61000, planned };

  it("keeps only ticked sets, snapshots targets, marks skipped and added", () => {
    const s = buildSession({ ...base, exercises: [
      { id: "p1", name: "Squat", catalogId: "squat", planned: true, targets: setTargets(planned[0]), rows: [row("30", "10", true), row("30", "10", false)] },
      { id: "p2", name: "Lunge", planned: true, targets: setTargets(planned[1]), rows: [row("8", "12", false)] },
      { id: "x1", name: "Plank", planned: false, targets: [{ reps: "1" }], rows: [row("0", "1", true)] },
      { id: "x2", name: "Curl", planned: false, targets: [{ reps: "10" }], rows: [row("10", "10", false)] },
    ] })!;
    expect(s).toMatchObject({ id: "s1", planId: "plan", dayId: "day", date: 1000, durationSeconds: 60 });
    expect(s.exercises.map((e) => [e.id, e.sets.length, e.added ?? false])).toEqual([
      ["p1", 1, false], ["p2", 0, false], ["x1", 1, true], ["p3", 0, false],
    ]);
    expect(s.exercises[0].targets).toEqual(planned[0].targets);
    expect(s.exercises[3].targets).toEqual([{ reps: "10" }]); // removed mid-workout -> skipped, legacy targets expanded
    expect(s.exercises[2].targets).toBeUndefined();
  });
  it("does not add a restored exercise twice", () => {
    const s = buildSession({ ...base, planned: [planned[0]], exercises: [
      { id: "p1", name: "Squat", planned: true, targets: setTargets(planned[0]), rows: [row("30", "10", true)] },
    ] })!;
    expect(s.exercises).toHaveLength(1);
  });
  it("returns null when nothing was ticked", () => {
    expect(buildSession({ ...base, exercises: [
      { id: "p1", name: "Squat", planned: true, targets: [], rows: [row("30", "10", false)] },
    ] })).toBeNull();
  });
});

describe("uncheckedSetCount", () => {
  it("counts every row that isn't ticked", () => {
    expect(uncheckedSetCount([{ id: "a", name: "A", planned: true, targets: [], rows: [
      { weight: "1", reps: "1", done: true, prefilled: false },
      { weight: "1", reps: "1", done: false, prefilled: true },
      { weight: "", reps: "", done: false, prefilled: false },
    ] }])).toBe(2);
  });
});
