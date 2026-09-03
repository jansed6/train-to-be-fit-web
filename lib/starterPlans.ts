import { savePlan, uid } from "./repo";
import { catalogById } from "./exerciseCatalog";
import type { Plan } from "./types";

interface StarterExercise {
  catalogId: string;
  sets: number;
  reps: string;
}
interface StarterDay {
  name: string;
  exercises: StarterExercise[];
}
export interface StarterPlan {
  id: string;
  name: string;
  subtitle: string;
  days: StarterDay[];
}

/** A classic 3-day Push / Pull / Legs split with core work each day. */
export const starterPlans: StarterPlan[] = [
  {
    id: "ppl",
    name: "Push / Pull / Legs",
    subtitle: "3 days a week · covers the whole body over a week",
    days: [
      {
        name: "Push",
        exercises: [
          { catalogId: "bench_press", sets: 4, reps: "6-8" },
          { catalogId: "overhead_press", sets: 3, reps: "8-10" },
          { catalogId: "incline_bench", sets: 3, reps: "8-10" },
          { catalogId: "lateral_raise", sets: 3, reps: "12-15" },
          { catalogId: "tricep_pushdown", sets: 3, reps: "10-12" },
          { catalogId: "hanging_leg_raise", sets: 3, reps: "10-12" },
        ],
      },
      {
        name: "Pull",
        exercises: [
          { catalogId: "deadlift", sets: 3, reps: "5" },
          { catalogId: "pullup", sets: 3, reps: "8-10" },
          { catalogId: "barbell_row", sets: 3, reps: "8-10" },
          { catalogId: "face_pull", sets: 3, reps: "15" },
          { catalogId: "barbell_curl", sets: 3, reps: "10-12" },
          { catalogId: "russian_twist", sets: 3, reps: "20" },
        ],
      },
      {
        name: "Legs",
        exercises: [
          { catalogId: "squat", sets: 4, reps: "6-8" },
          { catalogId: "romanian_deadlift", sets: 3, reps: "8-10" },
          { catalogId: "leg_press", sets: 3, reps: "10-12" },
          { catalogId: "leg_curl", sets: 3, reps: "12-15" },
          { catalogId: "calf_raise", sets: 4, reps: "12-15" },
          { catalogId: "plank", sets: 3, reps: "45" },
          { catalogId: "crunch", sets: 3, reps: "15-20" },
        ],
      },
    ],
  },
];

export function starterExerciseCount(sp: StarterPlan): number {
  return sp.days.reduce((n, d) => n + d.exercises.length, 0);
}

/** Insert a fresh copy of a starter plan into the store. */
export async function addStarterPlan(sp: StarterPlan): Promise<void> {
  const plan: Plan = {
    id: uid(),
    name: sp.name,
    createdAt: Date.now(),
    days: sp.days.map((d) => ({
      id: uid(),
      name: d.name,
      exercises: d.exercises.map((e) => ({
        id: uid(),
        name: catalogById(e.catalogId)?.name ?? e.catalogId,
        sets: e.sets,
        reps: e.reps,
        catalogId: e.catalogId,
      })),
    })),
  };
  await savePlan(plan);
}
