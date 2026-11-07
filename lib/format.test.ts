import { describe, it, expect } from "vitest";
import { formatLoggedSet, parseDuration, totalVolume } from "./format";

describe("parseDuration", () => {
  it.each([
    ["45", 45],
    ["45 s", 45],
    ["45s", 45],
    ["90 sec", 90],
    ["0:45", 45],
    ["1:30", 90],
    [" 2:05 ", 125],
    ["10:00", 600],
  ])("reads %j as %i seconds", (text, seconds) => {
    expect(parseDuration(text)).toBe(seconds);
  });

  it.each(["", "  ", "abc", "1:75", "1:2:3", "-5", "4.5"])("rejects %j", (text) => {
    expect(parseDuration(text)).toBeNull();
  });
});

describe("formatLoggedSet", () => {
  it("shows a rep set as weight × reps", () => {
    expect(formatLoggedSet({ setNumber: 1, weightKg: 27.5, reps: 8 })).toBe("27.5 kg × 8");
  });
  it("shows a timed set as its time, with the weight only when there is one", () => {
    expect(formatLoggedSet({ setNumber: 1, weightKg: 0, reps: 0, seconds: 45 })).toBe("0:45");
    expect(formatLoggedSet({ setNumber: 1, weightKg: 10, reps: 0, seconds: 75 })).toBe("10 kg · 1:15");
  });
});

describe("totalVolume", () => {
  it("counts no volume for timed sets", () => {
    expect(
      totalVolume({
        id: "s", date: 0, planDayName: "A", durationSeconds: 0,
        exercises: [
          { id: "a", name: "Squat", sets: [{ setNumber: 1, weightKg: 50, reps: 10 }] },
          { id: "b", name: "Plank", timed: true, sets: [{ setNumber: 1, weightKg: 10, reps: 0, seconds: 60 }] },
        ],
      }),
    ).toBe(500);
  });
});
