import { describe, it, expect } from "vitest";
import { doneSetCount, isTouched, parseDraft, type WorkoutDraft } from "./workoutDraft";

const draft: WorkoutDraft = {
  v: 1,
  userId: "u1",
  sessionId: "s1",
  planId: "plan",
  dayId: "day",
  planDayName: "Push",
  startedAt: 1000,
  planned: [{ id: "p1", name: "Bench", sets: 2, reps: "10" }],
  exercises: [
    {
      id: "p1", name: "Bench", planned: true, targets: [{ reps: "10" }, { reps: "10" }],
      rows: [
        { weight: "40", reps: "10", done: true, prefilled: false },
        { weight: "40", reps: "10", done: false, prefilled: true },
      ],
    },
  ],
};

describe("parseDraft", () => {
  it("reads back a stored workout", () => {
    expect(parseDraft(JSON.stringify(draft))).toEqual(draft);
  });

  it.each([
    ["nothing stored", null],
    ["not JSON", "{oops"],
    ["another version", JSON.stringify({ ...draft, v: 2 })],
    ["no owner", JSON.stringify({ ...draft, userId: undefined })],
    ["rows missing", JSON.stringify({ ...draft, exercises: [{ id: "x" }] })],
    ["a non-boolean touched", JSON.stringify({ ...draft, touched: "yes" })],
  ])("treats %s as no draft", (_label, raw) => {
    expect(parseDraft(raw)).toBeNull();
  });
});

describe("isTouched", () => {
  it("is what the draft says", () => {
    expect(isTouched({ ...draft, touched: false })).toBe(false);
    expect(isTouched({ ...draft, touched: true })).toBe(true);
  });
  it("counts drafts saved before the flag as touched (they had a ticked set)", () => {
    expect(isTouched(parseDraft(JSON.stringify(draft))!)).toBe(true);
  });
});

describe("doneSetCount", () => {
  it("counts ticked sets", () => {
    expect(doneSetCount(draft.exercises)).toBe(1);
  });
});
