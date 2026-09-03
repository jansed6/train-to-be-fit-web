// Offline exercise catalogue, ported from the iOS app's ExerciseCatalog.swift.
// Grouped by muscle group for the picker; aliases (Slovak + English) power search.

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Arms"
  | "Legs"
  | "Core";

export const muscleGroups: MuscleGroup[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
];

export interface CatalogExercise {
  id: string;
  name: string;
  group: MuscleGroup;
  muscles: string[];
  equipment: string;
  aliases: string[];
}

export const exerciseCatalog: CatalogExercise[] = [
  { id: "bench_press", name: "Barbell Bench Press", group: "Chest", muscles: ["chest", "triceps", "front delts"], equipment: "barbell, bench", aliases: ["bench press", "bench", "tlaky na lavičke", "tlaky s činkou"] },
  { id: "incline_bench", name: "Incline Barbell Bench Press", group: "Chest", muscles: ["upper chest", "front delts", "triceps"], equipment: "barbell, incline bench", aliases: ["šikmý bench", "incline bench", "horný bench"] },
  { id: "db_bench", name: "Dumbbell Bench Press", group: "Chest", muscles: ["chest", "triceps", "front delts"], equipment: "dumbbells, bench", aliases: ["tlaky s jednoručkami", "dumbbell bench"] },
  { id: "pushup", name: "Push-up", group: "Chest", muscles: ["chest", "triceps", "core"], equipment: "bodyweight", aliases: ["kliky", "klik", "push up", "push-up"] },
  { id: "chest_fly", name: "Chest Fly", group: "Chest", muscles: ["chest"], equipment: "dumbbells or cable", aliases: ["rozpažovanie", "fly", "rozpažky", "peck deck", "cable crossover"] },

  { id: "deadlift", name: "Deadlift", group: "Back", muscles: ["back", "glutes", "hamstrings"], equipment: "barbell", aliases: ["mŕtvy ťah", "deadlift", "mrtvy tah"] },
  { id: "pullup", name: "Pull-up", group: "Back", muscles: ["lats", "biceps"], equipment: "pull-up bar", aliases: ["zhyby", "zhyb", "priťahovanie na hrazde", "pull up", "hrazda"] },
  { id: "chinup", name: "Chin-up", group: "Back", muscles: ["back", "biceps"], equipment: "pull-up bar", aliases: ["zhyby podhmatom", "chin up", "podhmat na hrazde"] },
  { id: "lat_pulldown", name: "Lat Pulldown", group: "Back", muscles: ["lats", "biceps"], equipment: "cable pulldown", aliases: ["sťahovanie kladky", "lat pulldown", "priťahovanie hornej kladky"] },
  { id: "barbell_row", name: "Barbell Row", group: "Back", muscles: ["back", "rear delts", "biceps"], equipment: "barbell", aliases: ["veslovanie", "veslovanie s činkou", "príťahy v predklone", "barbell row"] },
  { id: "db_row", name: "Dumbbell Row", group: "Back", muscles: ["back", "biceps"], equipment: "dumbbell, bench", aliases: ["veslovanie s jednoručkou", "jednoručné veslovanie", "dumbbell row"] },
  { id: "seated_row", name: "Seated Cable Row", group: "Back", muscles: ["back", "rear delts", "biceps"], equipment: "cable row", aliases: ["veslovanie na kladke", "seated row", "spodná kladka"] },

  { id: "overhead_press", name: "Overhead Press", group: "Shoulders", muscles: ["shoulders", "triceps"], equipment: "barbell", aliases: ["tlaky nad hlavu", "vojenský tlak", "ohp", "overhead press", "military press"] },
  { id: "db_shoulder_press", name: "Dumbbell Shoulder Press", group: "Shoulders", muscles: ["shoulders", "triceps"], equipment: "dumbbells", aliases: ["tlaky s jednoručkami nad hlavu", "ramenný tlak", "shoulder press"] },
  { id: "lateral_raise", name: "Lateral Raise", group: "Shoulders", muscles: ["side delts"], equipment: "dumbbells", aliases: ["upažovanie", "bočné dvíhanie", "lateral raise", "upaženie"] },
  { id: "front_raise", name: "Front Raise", group: "Shoulders", muscles: ["front delts"], equipment: "dumbbells or plate", aliases: ["predpažovanie", "front raise", "predpaženie"] },
  { id: "face_pull", name: "Face Pull", group: "Shoulders", muscles: ["rear delts", "upper back"], equipment: "cable, rope", aliases: ["face pull", "priťahovanie k tvári", "facepull"] },

  { id: "barbell_curl", name: "Barbell Biceps Curl", group: "Arms", muscles: ["biceps"], equipment: "barbell", aliases: ["biceps", "zdvih na biceps", "bicepsový zdvih", "barbell curl"] },
  { id: "db_curl", name: "Dumbbell Curl", group: "Arms", muscles: ["biceps"], equipment: "dumbbells", aliases: ["biceps s jednoručkami", "dumbbell curl"] },
  { id: "hammer_curl", name: "Hammer Curl", group: "Arms", muscles: ["biceps", "forearms"], equipment: "dumbbells", aliases: ["kladivový zdvih", "hammer curl", "hammer"] },
  { id: "tricep_pushdown", name: "Triceps Pushdown", group: "Arms", muscles: ["triceps"], equipment: "cable pulldown", aliases: ["sťahovanie kladky na triceps", "triceps na kladke", "triceps pushdown", "pushdown"] },
  { id: "skullcrusher", name: "Skull Crusher", group: "Arms", muscles: ["triceps"], equipment: "barbell/EZ bar, bench", aliases: ["francúzsky tlak", "skull crusher", "skullcrusher"] },
  { id: "dips", name: "Triceps Dips", group: "Arms", muscles: ["triceps", "chest"], equipment: "parallel bars", aliases: ["dipy", "bradlá", "dips", "kľuky na bradlách"] },

  { id: "squat", name: "Barbell Back Squat", group: "Legs", muscles: ["quads", "glutes", "hamstrings"], equipment: "barbell, rack", aliases: ["drep", "drep so záťažou", "drep s činkou", "squat", "back squat", "drepy"] },
  { id: "front_squat", name: "Front Squat", group: "Legs", muscles: ["quads", "glutes", "core"], equipment: "barbell, rack", aliases: ["predný drep", "front squat", "čelný drep"] },
  { id: "goblet_squat", name: "Goblet Squat", group: "Legs", muscles: ["quads", "glutes"], equipment: "dumbbell or kettlebell", aliases: ["goblet drep", "goblet squat", "drep s jednoručkou"] },
  { id: "bulgarian_split", name: "Bulgarian Split Squat", group: "Legs", muscles: ["quads", "glutes"], equipment: "bench, optional dumbbells", aliases: ["bulharský drep", "bulgarian split squat", "výpad na lavičke"] },
  { id: "leg_press", name: "Leg Press", group: "Legs", muscles: ["quads", "glutes", "hamstrings"], equipment: "leg press machine", aliases: ["tlaky nohami", "leg press", "nožný tlak"] },
  { id: "lunge", name: "Lunges", group: "Legs", muscles: ["quads", "glutes"], equipment: "bodyweight or dumbbells", aliases: ["výpady", "výpad", "lunges", "lunge"] },
  { id: "leg_extension", name: "Leg Extension", group: "Legs", muscles: ["quads"], equipment: "machine", aliases: ["predkopávanie", "leg extension", "extenzia kolien"] },
  { id: "leg_curl", name: "Leg Curl", group: "Legs", muscles: ["hamstrings"], equipment: "machine", aliases: ["zakopávanie", "leg curl", "flexia kolien", "hamstring curl"] },
  { id: "calf_raise", name: "Calf Raise", group: "Legs", muscles: ["calves"], equipment: "bodyweight or machine", aliases: ["výpony", "lýtka", "calf raise"] },
  { id: "hip_thrust", name: "Hip Thrust", group: "Legs", muscles: ["glutes", "hamstrings"], equipment: "barbell, bench", aliases: ["hip thrust", "zdvih panvy", "mostík so záťažou"] },
  { id: "romanian_deadlift", name: "Romanian Deadlift", group: "Legs", muscles: ["hamstrings", "glutes", "back"], equipment: "barbell", aliases: ["rumunský mŕtvy ťah", "rmt", "romanian deadlift", "rdl"] },

  { id: "plank", name: "Plank", group: "Core", muscles: ["core", "abs"], equipment: "bodyweight", aliases: ["plank", "doska"] },
  { id: "crunch", name: "Crunch", group: "Core", muscles: ["abs"], equipment: "bodyweight", aliases: ["brušáky", "crunch", "brušák"] },
  { id: "hanging_leg_raise", name: "Hanging Leg Raise", group: "Core", muscles: ["lower abs"], equipment: "pull-up bar", aliases: ["dvíhanie nôh vo vise", "hanging leg raise", "leg raise"] },
  { id: "russian_twist", name: "Russian Twist", group: "Core", muscles: ["obliques"], equipment: "bodyweight or plate", aliases: ["ruské rotácie", "russian twist", "rotácie trupu"] },
];

export function catalogById(id: string | undefined): CatalogExercise | undefined {
  if (!id) return undefined;
  return exerciseCatalog.find((e) => e.id === id);
}

/** Lowercase, fold diacritics, strip punctuation — so "Drep" matches "drep". */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Filter the catalogue by name, muscles or aliases (Slovak included). */
export function searchCatalog(query: string): CatalogExercise[] {
  const q = normalize(query);
  if (!q) return exerciseCatalog;
  return exerciseCatalog.filter(
    (e) =>
      normalize(e.name).includes(q) ||
      e.muscles.some((m) => normalize(m).includes(q)) ||
      e.aliases.some((a) => normalize(a).includes(q)),
  );
}
