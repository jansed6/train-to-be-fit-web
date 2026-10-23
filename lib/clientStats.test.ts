import { describe, it, expect } from "vitest";
import { startOfWeekMs, countSince, weekStrip } from "./clientStats";
import type { WorkoutSession, SessionExercise } from "./types";

const wed = new Date(2026, 9, 21, 18, 0); // Wed 21 Oct 2026, local time
const at = (d: number, h = 10) => new Date(2026, 9, d, h).getTime();
const s = (date: number, exercises: SessionExercise[] = [], planId?: string): WorkoutSession =>
  ({ id: String(date), date, planDayName: "A", durationSeconds: 0, exercises, planId });

describe("clientStats", () => {
  it("week starts on Monday", () => expect(startOfWeekMs(wed)).toBe(new Date(2026, 9, 19).getTime()));
  it("counts sessions since a moment", () => expect(countSince([s(at(18)), s(at(19)), s(at(21))], startOfWeekMs(wed))).toBe(2));
  it("week strip marks trained and off-plan days", () => {
    const skipped = s(at(21), [{ id: "x", name: "Lunge", sets: [], targets: [{ reps: "12" }] }], "plan");
    const strip = weekStrip([s(at(19)), skipped, s(at(12))], wed);
    expect(strip.map((d) => d.label)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(strip.map((d) => d.trained)).toEqual([true, false, true, false, false, false, false]);
    expect(strip.map((d) => d.offPlan)).toEqual([false, false, true, false, false, false, false]);
  });
  it("DST regression: late Sunday session marks Sunday trained", () => {
    // 25 Oct 2026 is when DST ends in Europe/Bratislava (25-hour day)
    const lateSunday = new Date(2026, 9, 25, 23, 30).getTime();
    const strip = weekStrip([s(lateSunday)], wed);
    expect(strip[6].trained).toBe(true); // Sunday (index 6) should be marked trained
  });
});
