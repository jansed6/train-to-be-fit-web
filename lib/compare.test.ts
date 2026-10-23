import { describe, it, expect } from "vitest";
import type { SessionExercise, WorkoutSession, LoggedSet } from "./types";
import { compareSession, sessionStatusLabel } from "./compare";

const set = (weightKg: number, reps: number, setNumber = 1): LoggedSet => ({ setNumber, weightKg, reps });
const session = (exercises: SessionExercise[], planId?: string): WorkoutSession =>
  ({ id: "s", date: 0, planDayName: "B", durationSeconds: 0, planId: planId ?? "plan", dayId: (planId ?? "plan") && "d", exercises });

describe("compareSession", () => {
  it("flags a lighter set and a missing set; more than the target is fine", () => {
    const c = compareSession(session([
      { id: "a", name: "RDL", sets: [set(25, 10), set(22.5, 8, 2)], targets: [{ reps: "10", weightKg: 25 }, { reps: "10", weightKg: 25 }, { reps: "10", weightKg: 25 }] },
      { id: "b", name: "Squat", sets: [set(32.5, 12), set(30, 10, 2)], targets: [{ reps: "10", weightKg: 30 }] },
    ]));
    expect(c.exercises[0].status).toBe("below");
    expect(c.exercises[0].sets.map((s) => s.below)).toEqual([false, true, true]);
    expect(c.exercises[1].status).toBe("met");
    expect(c).toMatchObject({ tracked: true, skipped: 0, below: 1 });
  });

  it("compares reps against the lower bound and ignores weight when there is no weight target", () => {
    const c = compareSession(session([
      { id: "a", name: "Push-up", sets: [set(0, 8)], targets: [{ reps: "8-10" }] },
      { id: "b", name: "Plank", sets: [set(0, 1)], targets: [{ reps: "AMRAP" }] },
    ]));
    expect(c.exercises.map((e) => e.status)).toEqual(["met", "met"]);
  });

  it("marks skipped and added exercises", () => {
    const c = compareSession(session([
      { id: "a", name: "Lunge", sets: [], targets: [{ reps: "12", weightKg: 8 }] },
      { id: "b", name: "Curl", sets: [set(10, 10)], added: true },
    ]));
    expect(c.exercises.map((e) => e.status)).toEqual(["skipped", "added"]);
    expect(c).toMatchObject({ skipped: 1, below: 0 });
  });

  it("does not judge sessions saved before snapshots", () => {
    const untrackedSession: WorkoutSession = { id: "s", date: 0, planDayName: "B", durationSeconds: 0, planId: undefined, dayId: undefined, exercises: [{ id: "a", name: "Squat", sets: [set(50, 5)] }] };
    const c = compareSession(untrackedSession);
    expect(c.tracked).toBe(false);
    expect(c.exercises[0].status).toBe("untracked");
    expect(sessionStatusLabel(c)).toBeNull();
  });

  it.each([
    [{ tracked: true, skipped: 0, below: 0 }, "✓ All to plan"],
    [{ tracked: true, skipped: 1, below: 0 }, "1 skipped"],
    [{ tracked: true, skipped: 0, below: 2 }, "Below target on 2"],
    [{ tracked: true, skipped: 1, below: 2 }, "1 skipped · below target on 2"],
  ])("label %j -> %s", (c, text) => expect(sessionStatusLabel({ exercises: [], ...c })).toBe(text));
});
