import { saveSession, uid } from "./repo";
import type { WorkoutSession } from "./types";

// TEMPORARY: inserts a few sample sessions so the progress charts have data to
// show. Safe to delete this file (and the "Load sample data" buttons) later.
export async function loadSampleData(): Promise<void> {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const bench = [60, 62.5, 65, 65, 67.5, 70, 72.5, 75];
  const squat = [80, 85, 90, 92.5, 95, 100, 100, 105];
  const n = bench.length;

  for (let i = 0; i < n; i++) {
    const date = now - (n - 1 - i) * 5 * day; // one session every 5 days
    const session: WorkoutSession = {
      id: uid(),
      date,
      planDayName: "Sample",
      durationSeconds: 45 * 60,
      exercises: [
        {
          id: uid(),
          name: "Barbell Bench Press",
          catalogId: "bench_press",
          sets: [
            { setNumber: 1, weightKg: bench[i], reps: 8 },
            { setNumber: 2, weightKg: bench[i], reps: 7 },
            { setNumber: 3, weightKg: bench[i], reps: 6 },
          ],
        },
        {
          id: uid(),
          name: "Barbell Back Squat",
          catalogId: "squat",
          sets: [
            { setNumber: 1, weightKg: squat[i], reps: 6 },
            { setNumber: 2, weightKg: squat[i], reps: 6 },
            { setNumber: 3, weightKg: squat[i], reps: 5 },
          ],
        },
      ],
    };
    await saveSession(session);
  }
}
