import { describe, it, expect } from "vitest";
import { exerciseSummaries, personalRecordIndex, plotValue } from "./progress";
import type { LoggedSet, WorkoutSession } from "./types";

const session = (date: number, sets: LoggedSet[], timed = false): WorkoutSession => ({
  id: String(date), date, planDayName: "A", durationSeconds: 0,
  exercises: [{ id: "e", name: "Plank", catalogId: "plank", sets, ...(timed ? { timed: true } : {}) }],
});
const hold = (seconds: number, setNumber = 1, weightKg = 0): LoggedSet => ({ setNumber, weightKg, reps: 0, seconds });

describe("exerciseSummaries for timed exercises", () => {
  it("charts each session's longest hold", () => {
    const [plank] = exerciseSummaries([
      session(2, [hold(50), hold(65, 2)], true),
      session(1, [hold(40)], true),
    ]);
    expect(plank).toMatchObject({ timed: true, latestSeconds: 65, sessions: 2 });
    expect(plank.points.map(plotValue)).toEqual([40, 65]);
  });

  it("charts only the way it is logged now when it was switched from reps", () => {
    const [plank] = exerciseSummaries([
      session(1, [{ setNumber: 1, weightKg: 0, reps: 45 }]),
      session(2, [hold(50)], true),
    ]);
    expect(plank.timed).toBe(true);
    expect(plank.points.map((p) => p.date)).toEqual([2]);
  });

  it("leaves rep exercises as they were", () => {
    const [squat] = exerciseSummaries([session(1, [{ setNumber: 1, weightKg: 60, reps: 5 }])]);
    expect(squat).toMatchObject({ timed: false, latestWeight: 60 });
    expect(squat.latestSeconds).toBeUndefined();
    expect(plotValue(squat.points[0])).toBe(60);
  });
});

describe("personalRecordIndex", () => {
  it("is the longest hold for timed points, more weight breaking a tie", () => {
    const p = (seconds: number, weight = 0) => ({ date: 0, weight, reps: 0, est1RM: 0, seconds });
    expect(personalRecordIndex([p(40), p(70), p(55)])).toBe(1);
    expect(personalRecordIndex([p(60, 0), p(60, 10)])).toBe(1);
  });
});
