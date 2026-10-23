import { describe, it, expect } from "vitest";
import { sessionLevels } from "./muscles";

describe("sessionLevels", () => {
  it("ignores skipped exercises", () => {
    const levels = sessionLevels({ id: "s", date: 0, planDayName: "d", durationSeconds: 0, exercises: [
      { id: "a", name: "Barbell Back Squat", catalogId: "squat", sets: [{ setNumber: 1, weightKg: 50, reps: 5 }] },
      { id: "b", name: "Barbell Bench Press", catalogId: "bench_press", sets: [] },
    ] });
    expect(Object.keys(levels)).not.toContain("chest");
  });
});
