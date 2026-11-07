import { describe, it, expect } from "vitest";
import {
  prefilledRows,
  buildSession,
  isValidRow,
  uncheckedSetCount,
  weightsFromSessions,
  type WeightsByKey,
} from "./workoutRows";
import { setTargets } from "./planTargets";
import type { Exercise, LoggedSet, WorkoutSession } from "./types";

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

describe("weightsFromSessions", () => {
  const sessionWith = (sets: LoggedSet[]): WorkoutSession => ({
    id: "s", date: 0, planDayName: "A", durationSeconds: 0,
    exercises: [{ id: "e", name: "Bench", catalogId: "bench", sets }],
  });

  it("places last time's weights by set number, so a skipped set doesn't shift them", () => {
    const w = weightsFromSessions([sessionWith([
      { setNumber: 2, weightKg: 25, reps: 10 },
      { setNumber: 3, weightKg: 27.5, reps: 8 },
    ])]);
    const rows = prefilledRows({ name: "Bench", catalogId: "bench", sets: 3, reps: "10" }, w);
    // Set 1 had no weight last time: it takes the nearest logged one (set 2).
    expect(rows.map((r) => r.weight)).toEqual(["25", "25", "27.5"]);
  });
  it("fills a middle gap from the set before it and extends past the last set", () => {
    const w = weightsFromSessions([sessionWith([
      { setNumber: 1, weightKg: 20, reps: 12 },
      { setNumber: 3, weightKg: 30, reps: 8 },
    ])]);
    const rows = prefilledRows({ name: "Bench", catalogId: "bench", sets: 4, reps: "10" }, w);
    expect(rows.map((r) => r.weight)).toEqual(["20", "20", "30", "30"]);
  });
  it("reads sessions saved with packed set numbers as before", () => {
    const w = weightsFromSessions([sessionWith([
      { setNumber: 1, weightKg: 60, reps: 5 },
      { setNumber: 2, weightKg: 62.5, reps: 5 },
    ])]);
    expect(prefilledRows({ name: "Bench", catalogId: "bench", sets: 3, reps: "5" }, w).map((r) => r.weight))
      .toEqual(["60", "62.5", "62.5"]);
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
  it("keeps each ticked set's original set number when an earlier or middle row is unticked", () => {
    const s = buildSession({ ...base, planned: [], exercises: [
      { id: "x", name: "Bench", planned: false, targets: [], rows: [
        row("20", "12", false), row("25", "10", true), row("27,5", "8", true),
      ] },
      { id: "y", name: "Row", planned: false, targets: [], rows: [
        row("40", "10", true), row("40", "10", false), row("40", "9", true),
      ] },
    ] })!;
    expect(s.exercises[0].sets).toEqual([
      { setNumber: 2, weightKg: 25, reps: 10 },
      { setNumber: 3, weightKg: 27.5, reps: 8 },
    ]);
    expect(s.exercises[1].sets.map((x) => x.setNumber)).toEqual([1, 3]);
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

describe("timed exercises", () => {
  const plank: Exercise = {
    id: "p", name: "Plank", catalogId: "plank", sets: 2, reps: "", timed: true,
    targets: [{ reps: "", seconds: 45 }, { reps: "", seconds: 60 }],
  };

  it("prefills each set's time and 0 kg for a bodyweight hold", () => {
    expect(prefilledRows(plank, new Map())).toEqual([
      { weight: "0", reps: "", time: "0:45", done: false, prefilled: true },
      { weight: "0", reps: "", time: "1:00", done: false, prefilled: true },
    ]);
  });

  it("needs a time above 0; the weight may stay empty", () => {
    const row = (weight: string, time: string) => ({ weight, reps: "", time, done: false, prefilled: false });
    expect(isValidRow(row("", "0:30"), true)).toBe(true);
    expect(isValidRow(row("12,5", "45"), true)).toBe(true);
    expect(isValidRow(row("", "0:00"), true)).toBe(false);
    expect(isValidRow(row("", ""), true)).toBe(false);
    expect(isValidRow(row("abc", "45"), true)).toBe(false);
    // the same row isn't a valid rep set: it has no reps
    expect(isValidRow(row("0", "45"))).toBe(false);
  });

  it("saves ticked timed sets with their seconds and no reps", () => {
    const s = buildSession({
      id: "s", planId: "plan", dayId: "day", planDayName: "Core", startedAt: 0, finishedAt: 1000,
      planned: [plank],
      exercises: [{
        id: "p", name: "Plank", catalogId: "plank", planned: true, timed: true, targets: plank.targets!,
        rows: [
          { weight: "", reps: "", time: "0:52", done: true, prefilled: false },
          { weight: "10", reps: "", time: "40", done: true, prefilled: false },
        ],
      }],
    })!;
    expect(s.exercises[0]).toMatchObject({ timed: true, targets: plank.targets });
    expect(s.exercises[0].sets).toEqual([
      { setNumber: 1, weightKg: 0, reps: 0, seconds: 52 },
      { setNumber: 2, weightKg: 10, reps: 0, seconds: 40 },
    ]);
  });

  it("keeps a timed exercise removed mid-workout as timed and skipped", () => {
    const s = buildSession({
      id: "s", planId: "plan", dayId: "day", planDayName: "Core", startedAt: 0, finishedAt: 1000,
      planned: [plank, { id: "q", name: "Squat", sets: 1, reps: "5" }],
      exercises: [{ id: "q", name: "Squat", planned: true, targets: [{ reps: "5" }],
        rows: [{ weight: "50", reps: "5", done: true, prefilled: false }] }],
    })!;
    expect(s.exercises[1]).toMatchObject({ id: "p", timed: true, sets: [] });
    expect(s.exercises[0].timed).toBeUndefined();
  });
});
