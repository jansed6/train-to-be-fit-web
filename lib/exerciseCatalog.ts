// Offline exercise catalogue. The first 38 entries were ported from the iOS app; the rest,
// plus every photo and how-to step, come from free-exercise-db (public domain,
// https://github.com/yuhonas/free-exercise-db). Grouped by muscle group for the picker;
// aliases (Slovak + English) power search. `primary` / `secondary` drive the body map.

import type { MuscleKey } from "./muscles";

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Arms"
  | "Legs"
  | "Core"
  | "Stretching";

export const muscleGroups: MuscleGroup[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Stretching",
];

export interface CatalogExercise {
  id: string;
  name: string;
  /** Slovak name, shown under the English one. */
  sk: string;
  group: MuscleGroup;
  muscles: string[];
  primary: MuscleKey[];
  secondary: MuscleKey[];
  equipment: string;
  /** free-exercise-db id: photos live in /public/exercises/<image>/0.jpg and 1.jpg. */
  image?: string;
  aliases: string[];
}

export const exerciseCatalog: CatalogExercise[] = [
  { id: "bench_press", name: "Barbell Bench Press", sk: "Tlaky na lavičke", group: "Chest", muscles: ["chest", "triceps", "front delts"], primary: ["chest"], secondary: ["front-delts", "triceps"], equipment: "barbell, bench", image: "Barbell_Bench_Press_-_Medium_Grip", aliases: ["bench press", "bench", "tlaky na lavičke", "tlaky s činkou"] },
  { id: "incline_bench", name: "Incline Barbell Bench Press", sk: "Tlaky na šikmej lavičke", group: "Chest", muscles: ["upper chest", "front delts", "triceps"], primary: ["chest"], secondary: ["front-delts", "triceps"], equipment: "barbell, incline bench", image: "Barbell_Incline_Bench_Press_-_Medium_Grip", aliases: ["šikmý bench", "incline bench", "horný bench"] },
  { id: "db_bench", name: "Dumbbell Bench Press", sk: "Tlaky s jednoručkami na lavičke", group: "Chest", muscles: ["chest", "triceps", "front delts"], primary: ["chest"], secondary: ["front-delts", "triceps"], equipment: "dumbbells, bench", image: "Dumbbell_Bench_Press", aliases: ["tlaky s jednoručkami", "dumbbell bench"] },
  { id: "pushup", name: "Push-up", sk: "Kliky", group: "Chest", muscles: ["chest", "triceps", "core"], primary: ["chest"], secondary: ["front-delts", "triceps", "abs"], equipment: "bodyweight", image: "Pushups", aliases: ["kliky", "klik", "push up", "push-up"] },
  { id: "chest_fly", name: "Chest Fly", sk: "Rozpažovanie s jednoručkami", group: "Chest", muscles: ["chest"], primary: ["chest"], secondary: ["front-delts"], equipment: "dumbbells or cable", image: "Dumbbell_Flyes", aliases: ["rozpažovanie", "fly", "rozpažky", "peck deck", "cable crossover"] },

  { id: "deadlift", name: "Deadlift", sk: "Mŕtvy ťah", group: "Back", muscles: ["back", "glutes", "hamstrings"], primary: ["glutes", "hamstrings", "lower-back"], secondary: ["quads", "upper-back", "traps", "forearms"], equipment: "barbell", image: "Barbell_Deadlift", aliases: ["mŕtvy ťah", "deadlift", "mrtvy tah"] },
  { id: "pullup", name: "Pull-up", sk: "Zhyby nadhmatom", group: "Back", muscles: ["lats", "biceps"], primary: ["upper-back"], secondary: ["biceps", "rear-delts", "forearms"], equipment: "pull-up bar", image: "Pullups", aliases: ["zhyby", "zhyb", "priťahovanie na hrazde", "pull up", "hrazda"] },
  { id: "chinup", name: "Chin-up", sk: "Zhyby podhmatom", group: "Back", muscles: ["back", "biceps"], primary: ["upper-back", "biceps"], secondary: ["rear-delts", "forearms"], equipment: "pull-up bar", image: "Chin-Up", aliases: ["zhyby podhmatom", "chin up", "podhmat na hrazde"] },
  { id: "lat_pulldown", name: "Lat Pulldown", sk: "Sťahovanie hornej kladky", group: "Back", muscles: ["lats", "biceps"], primary: ["upper-back"], secondary: ["biceps", "rear-delts", "forearms"], equipment: "cable pulldown", image: "Wide-Grip_Lat_Pulldown", aliases: ["sťahovanie kladky", "lat pulldown", "priťahovanie hornej kladky"] },
  { id: "barbell_row", name: "Barbell Row", sk: "Predklonové veslovanie s činkou", group: "Back", muscles: ["back", "rear delts", "biceps"], primary: ["upper-back"], secondary: ["rear-delts", "biceps", "lower-back", "traps"], equipment: "barbell", image: "Bent_Over_Barbell_Row", aliases: ["veslovanie", "veslovanie s činkou", "príťahy v predklone", "barbell row"] },
  { id: "db_row", name: "Dumbbell Row", sk: "Jednoručné veslovanie s jednoručkou", group: "Back", muscles: ["back", "biceps"], primary: ["upper-back"], secondary: ["rear-delts", "biceps"], equipment: "dumbbell, bench", image: "One-Arm_Dumbbell_Row", aliases: ["veslovanie s jednoručkou", "jednoručné veslovanie", "dumbbell row"] },
  { id: "seated_row", name: "Seated Cable Row", sk: "Veslovanie na spodnej kladke", group: "Back", muscles: ["back", "rear delts", "biceps"], primary: ["upper-back"], secondary: ["rear-delts", "biceps", "traps"], equipment: "cable row", image: "Seated_Cable_Rows", aliases: ["veslovanie na kladke", "seated row", "spodná kladka"] },

  { id: "overhead_press", name: "Overhead Press", sk: "Tlaky s činkou nad hlavu", group: "Shoulders", muscles: ["shoulders", "triceps"], primary: ["front-delts"], secondary: ["delts", "triceps", "traps"], equipment: "barbell", image: "Standing_Military_Press", aliases: ["tlaky nad hlavu", "vojenský tlak", "ohp", "overhead press", "military press"] },
  { id: "db_shoulder_press", name: "Dumbbell Shoulder Press", sk: "Tlaky s jednoručkami nad hlavu", group: "Shoulders", muscles: ["shoulders", "triceps"], primary: ["front-delts"], secondary: ["delts", "triceps", "traps"], equipment: "dumbbells", image: "Dumbbell_Shoulder_Press", aliases: ["tlaky s jednoručkami nad hlavu", "ramenný tlak", "shoulder press"] },
  { id: "lateral_raise", name: "Lateral Raise", sk: "Upažovanie s jednoručkami", group: "Shoulders", muscles: ["side delts"], primary: ["delts"], secondary: ["traps"], equipment: "dumbbells", image: "Side_Lateral_Raise", aliases: ["upažovanie", "bočné dvíhanie", "lateral raise", "upaženie"] },
  { id: "front_raise", name: "Front Raise", sk: "Predpažovanie s jednoručkami", group: "Shoulders", muscles: ["front delts"], primary: ["front-delts"], secondary: ["chest"], equipment: "dumbbells or plate", image: "Front_Dumbbell_Raise", aliases: ["predpažovanie", "front raise", "predpaženie"] },
  { id: "face_pull", name: "Face Pull", sk: "Priťahovanie lana k tvári", group: "Shoulders", muscles: ["rear delts", "upper back"], primary: ["rear-delts"], secondary: ["traps", "upper-back"], equipment: "cable, rope", image: "Face_Pull", aliases: ["face pull", "priťahovanie k tvári", "facepull"] },

  { id: "barbell_curl", name: "Barbell Biceps Curl", sk: "Bicepsový zdvih s činkou", group: "Arms", muscles: ["biceps"], primary: ["biceps"], secondary: ["forearms"], equipment: "barbell", image: "Barbell_Curl", aliases: ["biceps", "zdvih na biceps", "bicepsový zdvih", "barbell curl"] },
  { id: "db_curl", name: "Dumbbell Curl", sk: "Bicepsový zdvih s jednoručkami", group: "Arms", muscles: ["biceps"], primary: ["biceps"], secondary: ["forearms"], equipment: "dumbbells", image: "Dumbbell_Bicep_Curl", aliases: ["biceps s jednoručkami", "dumbbell curl"] },
  { id: "hammer_curl", name: "Hammer Curl", sk: "Kladivový zdvih", group: "Arms", muscles: ["biceps", "forearms"], primary: ["biceps", "forearms"], secondary: [], equipment: "dumbbells", image: "Hammer_Curls", aliases: ["kladivový zdvih", "hammer curl", "hammer"] },
  { id: "tricep_pushdown", name: "Triceps Pushdown", sk: "Sťahovanie kladky na triceps", group: "Arms", muscles: ["triceps"], primary: ["triceps"], secondary: [], equipment: "cable pulldown", image: "Triceps_Pushdown", aliases: ["sťahovanie kladky na triceps", "triceps na kladke", "triceps pushdown", "pushdown"] },
  { id: "skullcrusher", name: "Skull Crusher", sk: "Francúzsky tlak", group: "Arms", muscles: ["triceps"], primary: ["triceps"], secondary: [], equipment: "barbell/EZ bar, bench", image: "EZ-Bar_Skullcrusher", aliases: ["francúzsky tlak", "skull crusher", "skullcrusher"] },
  { id: "dips", name: "Triceps Dips", sk: "Dipy na bradlách", group: "Arms", muscles: ["triceps", "chest"], primary: ["triceps", "chest"], secondary: ["front-delts"], equipment: "parallel bars", image: "Dips_-_Triceps_Version", aliases: ["dipy", "bradlá", "dips", "kľuky na bradlách"] },

  { id: "squat", name: "Barbell Back Squat", sk: "Drep s činkou", group: "Legs", muscles: ["quads", "glutes", "hamstrings"], primary: ["quads", "glutes"], secondary: ["hamstrings", "adductors", "lower-back"], equipment: "barbell, rack", image: "Barbell_Squat", aliases: ["drep", "drep so záťažou", "drep s činkou", "squat", "back squat", "drepy"] },
  { id: "front_squat", name: "Front Squat", sk: "Predný drep", group: "Legs", muscles: ["quads", "glutes", "core"], primary: ["quads"], secondary: ["glutes", "abs", "upper-back"], equipment: "barbell, rack", image: "Front_Barbell_Squat", aliases: ["predný drep", "front squat", "čelný drep"] },
  { id: "goblet_squat", name: "Goblet Squat", sk: "Goblet drep", group: "Legs", muscles: ["quads", "glutes"], primary: ["quads", "glutes"], secondary: ["adductors", "abs"], equipment: "dumbbell or kettlebell", image: "Goblet_Squat", aliases: ["goblet drep", "goblet squat", "drep s jednoručkou"] },
  { id: "bulgarian_split", name: "Bulgarian Split Squat", sk: "Bulharský drep", group: "Legs", muscles: ["quads", "glutes"], primary: ["quads", "glutes"], secondary: ["hamstrings", "adductors"], equipment: "bench, optional dumbbells", image: "Split_Squat_with_Dumbbells", aliases: ["bulharský drep", "bulgarian split squat", "výpad na lavičke"] },
  { id: "leg_press", name: "Leg Press", sk: "Tlaky nohami (leg press)", group: "Legs", muscles: ["quads", "glutes", "hamstrings"], primary: ["quads"], secondary: ["glutes", "hamstrings"], equipment: "leg press machine", image: "Leg_Press", aliases: ["tlaky nohami", "leg press", "nožný tlak"] },
  { id: "lunge", name: "Lunges", sk: "Výpady", group: "Legs", muscles: ["quads", "glutes"], primary: ["quads", "glutes"], secondary: ["hamstrings", "calves"], equipment: "bodyweight or dumbbells", image: "Dumbbell_Lunges", aliases: ["výpady", "výpad", "lunges", "lunge"] },
  { id: "leg_extension", name: "Leg Extension", sk: "Predkopávanie na stroji", group: "Legs", muscles: ["quads"], primary: ["quads"], secondary: [], equipment: "machine", image: "Leg_Extensions", aliases: ["predkopávanie", "leg extension", "extenzia kolien"] },
  { id: "leg_curl", name: "Leg Curl", sk: "Zakopávanie v ľahu", group: "Legs", muscles: ["hamstrings"], primary: ["hamstrings"], secondary: ["calves"], equipment: "machine", image: "Lying_Leg_Curls", aliases: ["zakopávanie", "leg curl", "flexia kolien", "hamstring curl"] },
  { id: "calf_raise", name: "Calf Raise", sk: "Výpony v stoji", group: "Legs", muscles: ["calves"], primary: ["calves"], secondary: [], equipment: "bodyweight or machine", image: "Standing_Calf_Raises", aliases: ["výpony", "lýtka", "calf raise"] },
  { id: "hip_thrust", name: "Hip Thrust", sk: "Zdvih panvy (hip thrust)", group: "Legs", muscles: ["glutes", "hamstrings"], primary: ["glutes"], secondary: ["hamstrings"], equipment: "barbell, bench", image: "Barbell_Hip_Thrust", aliases: ["hip thrust", "zdvih panvy", "mostík so záťažou"] },
  { id: "romanian_deadlift", name: "Romanian Deadlift", sk: "Rumunský mŕtvy ťah", group: "Legs", muscles: ["hamstrings", "glutes", "back"], primary: ["hamstrings", "glutes"], secondary: ["lower-back"], equipment: "barbell", image: "Romanian_Deadlift", aliases: ["rumunský mŕtvy ťah", "rmt", "romanian deadlift", "rdl"] },

  { id: "plank", name: "Plank", sk: "Plank (doska)", group: "Core", muscles: ["core", "abs"], primary: ["abs"], secondary: ["obliques", "front-delts"], equipment: "bodyweight", image: "Plank", aliases: ["plank", "doska"] },
  { id: "crunch", name: "Crunch", sk: "Brušáky (skracovačky)", group: "Core", muscles: ["abs"], primary: ["abs"], secondary: [], equipment: "bodyweight", image: "Crunches", aliases: ["brušáky", "crunch", "brušák"] },
  { id: "hanging_leg_raise", name: "Hanging Leg Raise", sk: "Dvíhanie nôh vo vise", group: "Core", muscles: ["lower abs"], primary: ["abs"], secondary: ["obliques", "forearms"], equipment: "pull-up bar", image: "Hanging_Leg_Raise", aliases: ["dvíhanie nôh vo vise", "hanging leg raise", "leg raise"] },
  { id: "russian_twist", name: "Russian Twist", sk: "Ruské rotácie", group: "Core", muscles: ["obliques"], primary: ["obliques"], secondary: ["abs"], equipment: "bodyweight or plate", image: "Russian_Twist", aliases: ["ruské rotácie", "russian twist", "rotácie trupu"] },

  // From free-exercise-db
  { id: "incline_dumbbell_press", name: "Incline Dumbbell Press", sk: "Tlaky s jednoručkami na šikmej lavičke", group: "Chest", muscles: ["chest", "front delts", "triceps"], primary: ["chest"], secondary: ["front-delts", "triceps"], equipment: "dumbbells", image: "Incline_Dumbbell_Press", aliases: ["tlaky s jednoručkami na šikmej lavičke", "šikmé tlaky s jednoručkami", "incline dumbbell press"] },
  { id: "decline_barbell_bench_press", name: "Decline Bench Press", sk: "Tlaky na negatívnej lavičke", group: "Chest", muscles: ["chest", "front delts", "triceps"], primary: ["chest"], secondary: ["front-delts", "triceps"], equipment: "barbell", image: "Decline_Barbell_Bench_Press", aliases: ["tlaky na negatívnej lavičke", "negatívny bench", "decline bench press"] },
  { id: "machine_bench_press", name: "Machine Chest Press", sk: "Tlaky na hrudník na stroji", group: "Chest", muscles: ["chest", "front delts", "triceps"], primary: ["chest"], secondary: ["front-delts", "triceps"], equipment: "machine", image: "Machine_Bench_Press", aliases: ["tlaky na hrudník na stroji", "chest press", "hrudný tlak na stroji", "machine chest press"] },
  { id: "smith_machine_bench_press", name: "Smith Machine Bench Press", sk: "Tlaky na lavičke v Smithovom stroji", group: "Chest", muscles: ["chest", "front delts", "triceps"], primary: ["chest"], secondary: ["front-delts", "triceps"], equipment: "machine", image: "Smith_Machine_Bench_Press", aliases: ["tlaky na lavičke v smithovom stroji", "smith bench", "smith machine bench press"] },
  { id: "cable_crossover", name: "Cable Crossover", sk: "Rozpažovanie na kladkách", group: "Chest", muscles: ["chest", "front delts"], primary: ["chest"], secondary: ["front-delts"], equipment: "cable", image: "Cable_Crossover", aliases: ["rozpažovanie na kladkách", "crossover", "kríženie kladiek", "cable crossover"] },
  { id: "butterfly", name: "Pec Deck", sk: "Rozpažovanie na stroji (butterfly)", group: "Chest", muscles: ["chest"], primary: ["chest"], secondary: [], equipment: "machine", image: "Butterfly", aliases: ["rozpažovanie na stroji (butterfly)", "butterfly", "peck deck", "motýlik", "pec deck"] },
  { id: "incline_dumbbell_flyes", name: "Incline Dumbbell Fly", sk: "Rozpažovanie na šikmej lavičke", group: "Chest", muscles: ["chest", "front delts"], primary: ["chest"], secondary: ["front-delts"], equipment: "dumbbells", image: "Incline_Dumbbell_Flyes", aliases: ["rozpažovanie na šikmej lavičke", "šikmé rozpažovanie", "incline dumbbell fly"] },
  { id: "push_up_wide", name: "Wide Push-up", sk: "Široké kliky", group: "Chest", muscles: ["chest", "abs", "front delts", "triceps"], primary: ["chest"], secondary: ["abs", "front-delts", "triceps"], equipment: "bodyweight", image: "Push-Up_Wide", aliases: ["široké kliky", "kliky široko", "wide push-up"] },
  { id: "incline_push_up", name: "Incline Push-up", sk: "Kliky s rukami na lavičke", group: "Chest", muscles: ["chest", "front delts", "triceps"], primary: ["chest"], secondary: ["front-delts", "triceps"], equipment: "bodyweight", image: "Incline_Push-Up", aliases: ["kliky s rukami na lavičke", "ľahšie kliky", "incline push-up"] },
  { id: "straight_arm_dumbbell_pullover", name: "Dumbbell Pullover", sk: "Pullover s jednoručkou", group: "Chest", muscles: ["chest", "lats & upper back", "front delts", "triceps"], primary: ["chest"], secondary: ["upper-back", "front-delts", "triceps"], equipment: "dumbbells", image: "Straight-Arm_Dumbbell_Pullover", aliases: ["pullover s jednoručkou", "prenos jednoručky za hlavu", "dumbbell pullover"] },
  { id: "t_bar_row_with_handle", name: "T-Bar Row", sk: "Veslovanie s T-tyčou", group: "Back", muscles: ["lats & upper back", "biceps"], primary: ["upper-back"], secondary: ["biceps"], equipment: "barbell", image: "T-Bar_Row_with_Handle", aliases: ["veslovanie s t-tyčou", "t-bar", "t-bar row"] },
  { id: "bent_over_two_dumbbell_row", name: "Bent-Over Dumbbell Row", sk: "Predklonové veslovanie s jednoručkami", group: "Back", muscles: ["lats & upper back", "biceps", "rear delts"], primary: ["upper-back"], secondary: ["biceps", "rear-delts"], equipment: "dumbbells", image: "Bent_Over_Two-Dumbbell_Row", aliases: ["predklonové veslovanie s jednoručkami", "bent-over dumbbell row"] },
  { id: "close_grip_front_lat_pulldown", name: "Close-Grip Lat Pulldown", sk: "Sťahovanie kladky úzkym úchopom", group: "Back", muscles: ["lats & upper back", "biceps", "rear delts"], primary: ["upper-back"], secondary: ["biceps", "rear-delts"], equipment: "cable", image: "Close-Grip_Front_Lat_Pulldown", aliases: ["sťahovanie kladky úzkym úchopom", "close-grip lat pulldown"] },
  { id: "underhand_cable_pulldowns", name: "Underhand Lat Pulldown", sk: "Sťahovanie kladky podhmatom", group: "Back", muscles: ["lats & upper back", "biceps", "rear delts"], primary: ["upper-back"], secondary: ["biceps", "rear-delts"], equipment: "cable", image: "Underhand_Cable_Pulldowns", aliases: ["sťahovanie kladky podhmatom", "underhand lat pulldown"] },
  { id: "straight_arm_pulldown", name: "Straight-Arm Pulldown", sk: "Sťahovanie kladky vystretými rukami", group: "Back", muscles: ["lats & upper back"], primary: ["upper-back"], secondary: [], equipment: "cable", image: "Straight-Arm_Pulldown", aliases: ["sťahovanie kladky vystretými rukami", "pullover na kladke", "straight-arm pulldown"] },
  { id: "leverage_iso_row", name: "Machine Row", sk: "Veslovanie na stroji", group: "Back", muscles: ["lats & upper back", "biceps"], primary: ["upper-back"], secondary: ["biceps"], equipment: "machine", image: "Leverage_Iso_Row", aliases: ["veslovanie na stroji", "veslovací stroj", "machine row"] },
  { id: "leverage_high_row", name: "Machine High Row", sk: "Veslovanie zhora na stroji", group: "Back", muscles: ["lats & upper back"], primary: ["upper-back"], secondary: [], equipment: "machine", image: "Leverage_High_Row", aliases: ["veslovanie zhora na stroji", "machine high row"] },
  { id: "seated_one_arm_cable_pulley_rows", name: "Single-Arm Cable Row", sk: "Jednoručné veslovanie na kladke", group: "Back", muscles: ["lats & upper back", "biceps", "traps"], primary: ["upper-back"], secondary: ["biceps", "traps"], equipment: "cable", image: "Seated_One-arm_Cable_Pulley_Rows", aliases: ["jednoručné veslovanie na kladke", "single-arm cable row"] },
  { id: "hyperextensions_back_extensions", name: "Back Extension", sk: "Hyperextenzie (záklony na lavici)", group: "Back", muscles: ["lower back", "glutes", "hamstrings"], primary: ["lower-back"], secondary: ["glutes", "hamstrings"], equipment: "other", image: "Hyperextensions_Back_Extensions", aliases: ["hyperextenzie (záklony na lavici)", "hyperextenzie", "záklony", "back extension"] },
  { id: "rack_pulls", name: "Rack Pull", sk: "Mŕtvy ťah zo stojanov", group: "Back", muscles: ["lower back", "forearms", "glutes", "hamstrings", "traps"], primary: ["lower-back"], secondary: ["forearms", "glutes", "hamstrings", "traps"], equipment: "barbell", image: "Rack_Pulls", aliases: ["mŕtvy ťah zo stojanov", "rack pull"] },
  { id: "barbell_shrug", name: "Barbell Shrug", sk: "Krčenie ramien s činkou", group: "Back", muscles: ["traps"], primary: ["traps"], secondary: [], equipment: "barbell", image: "Barbell_Shrug", aliases: ["krčenie ramien s činkou", "shrugs", "trapézy", "barbell shrug"] },
  { id: "dumbbell_shrug", name: "Dumbbell Shrug", sk: "Krčenie ramien s jednoručkami", group: "Back", muscles: ["traps"], primary: ["traps"], secondary: [], equipment: "dumbbells", image: "Dumbbell_Shrug", aliases: ["krčenie ramien s jednoručkami", "dumbbell shrug"] },
  { id: "arnold_dumbbell_press", name: "Arnold Press", sk: "Arnoldove tlaky", group: "Shoulders", muscles: ["front delts", "triceps"], primary: ["front-delts"], secondary: ["triceps"], equipment: "dumbbells", image: "Arnold_Dumbbell_Press", aliases: ["arnoldove tlaky", "arnold press"] },
  { id: "machine_shoulder_military_press", name: "Machine Shoulder Press", sk: "Tlaky nad hlavu na stroji", group: "Shoulders", muscles: ["front delts", "triceps"], primary: ["front-delts"], secondary: ["triceps"], equipment: "machine", image: "Machine_Shoulder_Military_Press", aliases: ["tlaky nad hlavu na stroji", "machine shoulder press"] },
  { id: "seated_barbell_military_press", name: "Seated Barbell Press", sk: "Tlaky s činkou nad hlavu v sede", group: "Shoulders", muscles: ["front delts", "triceps"], primary: ["front-delts"], secondary: ["triceps"], equipment: "barbell", image: "Seated_Barbell_Military_Press", aliases: ["tlaky s činkou nad hlavu v sede", "seated barbell press"] },
  { id: "cable_seated_lateral_raise", name: "Cable Lateral Raise", sk: "Upažovanie na kladke", group: "Shoulders", muscles: ["shoulders", "lats & upper back", "traps"], primary: ["delts"], secondary: ["upper-back", "traps"], equipment: "cable", image: "Cable_Seated_Lateral_Raise", aliases: ["upažovanie na kladke", "cable lateral raise"] },
  { id: "reverse_flyes", name: "Reverse Dumbbell Fly", sk: "Zadné rozpažovanie s jednoručkami", group: "Shoulders", muscles: ["rear delts"], primary: ["rear-delts"], secondary: [], equipment: "dumbbells", image: "Reverse_Flyes", aliases: ["zadné rozpažovanie s jednoručkami", "rozpažovanie v predklone", "reverse dumbbell fly"] },
  { id: "reverse_machine_flyes", name: "Reverse Pec Deck", sk: "Zadné rozpažovanie na stroji", group: "Shoulders", muscles: ["shoulders"], primary: ["delts"], secondary: [], equipment: "machine", image: "Reverse_Machine_Flyes", aliases: ["zadné rozpažovanie na stroji", "reverse butterfly", "reverse pec deck"] },
  { id: "cable_rear_delt_fly", name: "Cable Rear Delt Fly", sk: "Zadné rozpažovanie na kladkách", group: "Shoulders", muscles: ["rear delts"], primary: ["rear-delts"], secondary: [], equipment: "cable", image: "Cable_Rear_Delt_Fly", aliases: ["zadné rozpažovanie na kladkách", "cable rear delt fly"] },
  { id: "upright_barbell_row", name: "Upright Row", sk: "Priťahovanie činky k brade", group: "Shoulders", muscles: ["shoulders", "traps"], primary: ["delts"], secondary: ["traps"], equipment: "barbell", image: "Upright_Barbell_Row", aliases: ["priťahovanie činky k brade", "priťahy k brade", "upright row"] },
  { id: "external_rotation_with_cable", name: "Cable External Rotation", sk: "Vonkajšia rotácia ramena na kladke", group: "Shoulders", muscles: ["rear delts"], primary: ["rear-delts"], secondary: [], equipment: "cable", image: "External_Rotation_with_Cable", aliases: ["vonkajšia rotácia ramena na kladke", "rotátorová manžeta", "cable external rotation"] },
  { id: "ez_bar_curl", name: "EZ-Bar Curl", sk: "Bicepsový zdvih s EZ tyčou", group: "Arms", muscles: ["biceps"], primary: ["biceps"], secondary: [], equipment: "EZ bar", image: "EZ-Bar_Curl", aliases: ["bicepsový zdvih s ez tyčou", "ez-bar curl"] },
  { id: "preacher_curl", name: "Preacher Curl", sk: "Zdvih na Scottovej lavici", group: "Arms", muscles: ["biceps"], primary: ["biceps"], secondary: [], equipment: "barbell", image: "Preacher_Curl", aliases: ["zdvih na scottovej lavici", "scottova lavica", "preacher curl"] },
  { id: "concentration_curls", name: "Concentration Curl", sk: "Koncentrovaný bicepsový zdvih", group: "Arms", muscles: ["biceps", "forearms"], primary: ["biceps"], secondary: ["forearms"], equipment: "dumbbells", image: "Concentration_Curls", aliases: ["koncentrovaný bicepsový zdvih", "concentration curl"] },
  { id: "incline_dumbbell_curl", name: "Incline Dumbbell Curl", sk: "Bicepsový zdvih na šikmej lavičke", group: "Arms", muscles: ["biceps"], primary: ["biceps"], secondary: [], equipment: "dumbbells", image: "Incline_Dumbbell_Curl", aliases: ["bicepsový zdvih na šikmej lavičke", "incline dumbbell curl"] },
  { id: "standing_biceps_cable_curl", name: "Cable Curl", sk: "Bicepsový zdvih na kladke", group: "Arms", muscles: ["biceps"], primary: ["biceps"], secondary: [], equipment: "cable", image: "Standing_Biceps_Cable_Curl", aliases: ["bicepsový zdvih na kladke", "cable curl"] },
  { id: "cable_hammer_curls_rope_attachment", name: "Rope Hammer Curl", sk: "Kladivový zdvih s lanom", group: "Arms", muscles: ["biceps"], primary: ["biceps"], secondary: [], equipment: "cable", image: "Cable_Hammer_Curls_-_Rope_Attachment", aliases: ["kladivový zdvih s lanom", "rope hammer curl"] },
  { id: "reverse_barbell_curl", name: "Reverse Barbell Curl", sk: "Zdvih s činkou nadhmatom", group: "Arms", muscles: ["biceps", "forearms"], primary: ["biceps"], secondary: ["forearms"], equipment: "barbell", image: "Reverse_Barbell_Curl", aliases: ["zdvih s činkou nadhmatom", "reverse barbell curl"] },
  { id: "triceps_pushdown_rope_attachment", name: "Rope Pushdown", sk: "Sťahovanie lana na triceps", group: "Arms", muscles: ["triceps"], primary: ["triceps"], secondary: [], equipment: "cable", image: "Triceps_Pushdown_-_Rope_Attachment", aliases: ["sťahovanie lana na triceps", "rope pushdown"] },
  { id: "cable_rope_overhead_triceps_extension", name: "Overhead Rope Extension", sk: "Tricepsový tlak s lanom nad hlavou", group: "Arms", muscles: ["triceps"], primary: ["triceps"], secondary: [], equipment: "cable", image: "Cable_Rope_Overhead_Triceps_Extension", aliases: ["tricepsový tlak s lanom nad hlavou", "overhead rope extension"] },
  { id: "standing_dumbbell_triceps_extension", name: "Overhead Dumbbell Extension", sk: "Tricepsový tlak s jednoručkou nad hlavou", group: "Arms", muscles: ["triceps"], primary: ["triceps"], secondary: [], equipment: "dumbbells", image: "Standing_Dumbbell_Triceps_Extension", aliases: ["tricepsový tlak s jednoručkou nad hlavou", "francúzsky tlak v stoji", "overhead dumbbell extension"] },
  { id: "tricep_dumbbell_kickback", name: "Dumbbell Kickback", sk: "Zanožovanie jednoručky na triceps", group: "Arms", muscles: ["triceps"], primary: ["triceps"], secondary: [], equipment: "dumbbells", image: "Tricep_Dumbbell_Kickback", aliases: ["zanožovanie jednoručky na triceps", "kickback", "dumbbell kickback"] },
  { id: "close_grip_barbell_bench_press", name: "Close-Grip Bench Press", sk: "Tlaky na lavičke úzkym úchopom", group: "Arms", muscles: ["triceps", "chest", "front delts"], primary: ["triceps"], secondary: ["chest", "front-delts"], equipment: "barbell", image: "Close-Grip_Barbell_Bench_Press", aliases: ["tlaky na lavičke úzkym úchopom", "úzky bench", "close-grip bench press"] },
  { id: "bench_dips", name: "Bench Dip", sk: "Dipy na lavičke", group: "Arms", muscles: ["triceps", "chest", "front delts"], primary: ["triceps"], secondary: ["chest", "front-delts"], equipment: "bodyweight", image: "Bench_Dips", aliases: ["dipy na lavičke", "kľuky vzad", "bench dip"] },
  { id: "dip_machine", name: "Machine Dip", sk: "Dipy na stroji", group: "Arms", muscles: ["triceps", "chest", "front delts"], primary: ["triceps"], secondary: ["chest", "front-delts"], equipment: "machine", image: "Dip_Machine", aliases: ["dipy na stroji", "machine dip"] },
  { id: "palms_up_barbell_wrist_curl_over_a_bench", name: "Wrist Curl", sk: "Zdvihy v zápästí", group: "Arms", muscles: ["forearms"], primary: ["forearms"], secondary: [], equipment: "barbell", image: "Palms-Up_Barbell_Wrist_Curl_Over_A_Bench", aliases: ["zdvihy v zápästí", "predlaktia", "wrist curl"] },
  { id: "hack_squat", name: "Hack Squat", sk: "Drep na hack stroji", group: "Legs", muscles: ["quads", "calves", "glutes", "hamstrings"], primary: ["quads"], secondary: ["calves", "glutes", "hamstrings"], equipment: "machine", image: "Hack_Squat", aliases: ["drep na hack stroji", "hackenschmidt", "hack squat"] },
  { id: "smith_machine_squat", name: "Smith Machine Squat", sk: "Drep v Smithovom stroji", group: "Legs", muscles: ["quads", "calves", "glutes", "hamstrings", "lower back"], primary: ["quads"], secondary: ["calves", "glutes", "hamstrings", "lower-back"], equipment: "machine", image: "Smith_Machine_Squat", aliases: ["drep v smithovom stroji", "smith machine squat"] },
  { id: "bodyweight_squat", name: "Bodyweight Squat", sk: "Drep bez záťaže", group: "Legs", muscles: ["quads", "glutes", "hamstrings"], primary: ["quads"], secondary: ["glutes", "hamstrings"], equipment: "bodyweight", image: "Bodyweight_Squat", aliases: ["drep bez záťaže", "drepy", "bodyweight squat"] },
  { id: "plie_dumbbell_squat", name: "Sumo Dumbbell Squat", sk: "Sumo drep s jednoručkou", group: "Legs", muscles: ["quads", "adductors", "glutes"], primary: ["quads", "adductors"], secondary: ["glutes"], equipment: "dumbbells", image: "Plie_Dumbbell_Squat", aliases: ["sumo drep s jednoručkou", "plié drep", "sumo dumbbell squat"] },
  { id: "barbell_walking_lunge", name: "Walking Lunge", sk: "Výpady v chôdzi", group: "Legs", muscles: ["quads", "calves", "glutes", "hamstrings"], primary: ["quads"], secondary: ["calves", "glutes", "hamstrings"], equipment: "barbell", image: "Barbell_Walking_Lunge", aliases: ["výpady v chôdzi", "walking lunge"] },
  { id: "dumbbell_rear_lunge", name: "Reverse Lunge", sk: "Výpady vzad", group: "Legs", muscles: ["quads", "calves", "glutes", "hamstrings"], primary: ["quads"], secondary: ["calves", "glutes", "hamstrings"], equipment: "dumbbells", image: "Dumbbell_Rear_Lunge", aliases: ["výpady vzad", "zakročenie", "reverse lunge"] },
  { id: "dumbbell_step_ups", name: "Step-up", sk: "Výstupy na lavičku", group: "Legs", muscles: ["quads", "calves", "glutes", "hamstrings"], primary: ["quads"], secondary: ["calves", "glutes", "hamstrings"], equipment: "dumbbells", image: "Dumbbell_Step_Ups", aliases: ["výstupy na lavičku", "výstupy", "step-up"] },
  { id: "seated_leg_curl", name: "Seated Leg Curl", sk: "Zakopávanie v sede", group: "Legs", muscles: ["hamstrings"], primary: ["hamstrings"], secondary: [], equipment: "machine", image: "Seated_Leg_Curl", aliases: ["zakopávanie v sede", "seated leg curl"] },
  { id: "stiff_legged_dumbbell_deadlift", name: "Dumbbell Romanian Deadlift", sk: "Rumunský mŕtvy ťah s jednoručkami", group: "Legs", muscles: ["hamstrings", "glutes", "lower back"], primary: ["hamstrings"], secondary: ["glutes", "lower-back"], equipment: "dumbbells", image: "Stiff-Legged_Dumbbell_Deadlift", aliases: ["rumunský mŕtvy ťah s jednoručkami", "dumbbell romanian deadlift"] },
  { id: "sumo_deadlift", name: "Sumo Deadlift", sk: "Sumo mŕtvy ťah", group: "Legs", muscles: ["hamstrings", "adductors", "forearms", "glutes", "lower back", "lats & upper back", "quads", "traps"], primary: ["hamstrings"], secondary: ["adductors", "forearms", "glutes", "lower-back", "upper-back", "quads", "traps"], equipment: "barbell", image: "Sumo_Deadlift", aliases: ["sumo mŕtvy ťah", "sumo deadlift"] },
  { id: "good_morning", name: "Good Morning", sk: "Predklony s činkou na pleciach", group: "Legs", muscles: ["hamstrings", "abs", "glutes", "lower back"], primary: ["hamstrings"], secondary: ["abs", "glutes", "lower-back"], equipment: "barbell", image: "Good_Morning", aliases: ["predklony s činkou na pleciach", "good morning"] },
  { id: "barbell_glute_bridge", name: "Glute Bridge", sk: "Mostík s činkou", group: "Legs", muscles: ["glutes", "calves", "hamstrings"], primary: ["glutes"], secondary: ["calves", "hamstrings"], equipment: "barbell", image: "Barbell_Glute_Bridge", aliases: ["mostík s činkou", "glute bridge"] },
  { id: "single_leg_glute_bridge", name: "Single-Leg Glute Bridge", sk: "Jednonožný mostík", group: "Legs", muscles: ["glutes", "hamstrings"], primary: ["glutes"], secondary: ["hamstrings"], equipment: "bodyweight", image: "Single_Leg_Glute_Bridge", aliases: ["jednonožný mostík", "single-leg glute bridge"] },
  { id: "glute_kickback", name: "Glute Kickback", sk: "Zanožovanie v kľaku", group: "Legs", muscles: ["glutes", "hamstrings"], primary: ["glutes"], secondary: ["hamstrings"], equipment: "bodyweight", image: "Glute_Kickback", aliases: ["zanožovanie v kľaku", "kopanie vzad", "glute kickback"] },
  { id: "one_legged_cable_kickback", name: "Cable Glute Kickback", sk: "Zanožovanie na kladke", group: "Legs", muscles: ["glutes", "hamstrings"], primary: ["glutes"], secondary: ["hamstrings"], equipment: "cable", image: "One-Legged_Cable_Kickback", aliases: ["zanožovanie na kladke", "cable glute kickback"] },
  { id: "pull_through", name: "Cable Pull-Through", sk: "Pull-through na kladke", group: "Legs", muscles: ["glutes", "hamstrings", "lower back"], primary: ["glutes"], secondary: ["hamstrings", "lower-back"], equipment: "cable", image: "Pull_Through", aliases: ["pull-through na kladke", "cable pull-through"] },
  { id: "thigh_abductor", name: "Hip Abduction Machine", sk: "Unožovanie na stroji", group: "Legs", muscles: ["glutes"], primary: ["glutes"], secondary: [], equipment: "machine", image: "Thigh_Abductor", aliases: ["unožovanie na stroji", "abduktory", "abdukcia", "hip abduction machine"] },
  { id: "thigh_adductor", name: "Hip Adduction Machine", sk: "Prinožovanie na stroji", group: "Legs", muscles: ["adductors", "glutes", "hamstrings"], primary: ["adductors"], secondary: ["glutes", "hamstrings"], equipment: "machine", image: "Thigh_Adductor", aliases: ["prinožovanie na stroji", "adduktory", "addukcia", "hip adduction machine"] },
  { id: "seated_calf_raise", name: "Seated Calf Raise", sk: "Výpony v sede", group: "Legs", muscles: ["calves"], primary: ["calves"], secondary: [], equipment: "machine", image: "Seated_Calf_Raise", aliases: ["výpony v sede", "seated calf raise"] },
  { id: "calf_press_on_the_leg_press_machine", name: "Leg Press Calf Raise", sk: "Výpony na leg presse", group: "Legs", muscles: ["calves"], primary: ["calves"], secondary: [], equipment: "machine", image: "Calf_Press_On_The_Leg_Press_Machine", aliases: ["výpony na leg presse", "leg press calf raise"] },
  { id: "one_arm_kettlebell_swings", name: "Kettlebell Swing", sk: "Švihy s kettlebellom", group: "Legs", muscles: ["glutes", "hamstrings", "lower back", "front delts"], primary: ["glutes", "hamstrings"], secondary: ["lower-back", "front-delts"], equipment: "kettlebell", image: "One-Arm_Kettlebell_Swings", aliases: ["švihy s kettlebellom", "swing", "kettlebell", "kettlebell swing"] },
  { id: "cable_crunch", name: "Cable Crunch", sk: "Brušáky na kladke v kľaku", group: "Core", muscles: ["abs"], primary: ["abs"], secondary: [], equipment: "cable", image: "Cable_Crunch", aliases: ["brušáky na kladke v kľaku", "cable crunch"] },
  { id: "ab_crunch_machine", name: "Ab Crunch Machine", sk: "Brušáky na stroji", group: "Core", muscles: ["abs"], primary: ["abs"], secondary: [], equipment: "machine", image: "Ab_Crunch_Machine", aliases: ["brušáky na stroji", "ab crunch machine"] },
  { id: "sit_up", name: "Sit-up", sk: "Sed-ľah", group: "Core", muscles: ["abs"], primary: ["abs"], secondary: [], equipment: "bodyweight", image: "Sit-Up", aliases: ["sed-ľah", "sedy-ľahy", "sit-up"] },
  { id: "reverse_crunch", name: "Reverse Crunch", sk: "Spätné skracovačky", group: "Core", muscles: ["abs"], primary: ["abs"], secondary: [], equipment: "bodyweight", image: "Reverse_Crunch", aliases: ["spätné skracovačky", "reverse crunch"] },
  { id: "flat_bench_lying_leg_raise", name: "Lying Leg Raise", sk: "Dvíhanie nôh v ľahu", group: "Core", muscles: ["abs"], primary: ["abs"], secondary: [], equipment: "bodyweight", image: "Flat_Bench_Lying_Leg_Raise", aliases: ["dvíhanie nôh v ľahu", "lying leg raise"] },
  { id: "oblique_crunches_on_the_floor", name: "Oblique Crunch", sk: "Šikmé brušáky", group: "Core", muscles: ["obliques", "abs"], primary: ["obliques"], secondary: ["abs"], equipment: "bodyweight", image: "Oblique_Crunches_-_On_The_Floor", aliases: ["šikmé brušáky", "oblique crunch"] },
  { id: "air_bike", name: "Bicycle Crunch", sk: "Bicykel (brušáky)", group: "Core", muscles: ["abs", "obliques"], primary: ["abs", "obliques"], secondary: [], equipment: "bodyweight", image: "Air_Bike", aliases: ["bicykel (brušáky)", "bicykel", "bicycle crunch"] },
  { id: "dead_bug", name: "Dead Bug", sk: "Mŕtvy chrobák", group: "Core", muscles: ["abs"], primary: ["abs"], secondary: [], equipment: "bodyweight", image: "Dead_Bug", aliases: ["mŕtvy chrobák", "dead bug"] },
  { id: "side_bridge", name: "Side Plank", sk: "Bočný plank", group: "Core", muscles: ["obliques", "abs"], primary: ["obliques"], secondary: ["abs"], equipment: "bodyweight", image: "Side_Bridge", aliases: ["bočný plank", "bočná doska", "side plank"] },
  { id: "barbell_ab_rollout", name: "Ab Rollout", sk: "Rollout na brucho", group: "Core", muscles: ["abs", "lower back", "shoulders"], primary: ["abs"], secondary: ["lower-back", "delts"], equipment: "barbell", image: "Barbell_Ab_Rollout", aliases: ["rollout na brucho", "koliesko na brucho", "ab rollout"] },
  { id: "pallof_press", name: "Pallof Press", sk: "Pallofov tlak", group: "Core", muscles: ["obliques", "abs"], primary: ["obliques", "abs"], secondary: [], equipment: "cable", image: "Pallof_Press", aliases: ["pallofov tlak", "pallof press"] },
  { id: "standing_cable_wood_chop", name: "Cable Woodchop", sk: "Drevorubač na kladke", group: "Core", muscles: ["obliques", "abs", "shoulders"], primary: ["obliques"], secondary: ["abs", "delts"], equipment: "cable", image: "Standing_Cable_Wood_Chop", aliases: ["drevorubač na kladke", "woodchop", "cable woodchop"] },
  { id: "hamstring_stretch", name: "Hamstring Stretch", sk: "Strečing zadnej strany stehien", group: "Stretching", muscles: ["hamstrings"], primary: ["hamstrings"], secondary: [], equipment: "bodyweight", image: "Hamstring_Stretch", aliases: ["strečing zadnej strany stehien", "hamstring stretch"] },
  { id: "seated_floor_hamstring_stretch", name: "Seated Hamstring Stretch", sk: "Predklon v sede", group: "Stretching", muscles: ["hamstrings", "calves"], primary: ["hamstrings"], secondary: ["calves"], equipment: "bodyweight", image: "Seated_Floor_Hamstring_Stretch", aliases: ["predklon v sede", "seated hamstring stretch"] },
  { id: "quad_stretch", name: "Standing Quad Stretch", sk: "Strečing predného stehna v stoji", group: "Stretching", muscles: ["quads"], primary: ["quads"], secondary: [], equipment: "other", image: "Quad_Stretch", aliases: ["strečing predného stehna v stoji", "standing quad stretch"] },
  { id: "kneeling_hip_flexor", name: "Kneeling Hip Flexor Stretch", sk: "Strečing bedrového flexora v kľaku", group: "Stretching", muscles: ["quads"], primary: ["quads"], secondary: [], equipment: "bodyweight", image: "Kneeling_Hip_Flexor", aliases: ["strečing bedrového flexora v kľaku", "flexory bedra", "kneeling hip flexor stretch"] },
  { id: "calf_stretch_hands_against_wall", name: "Calf Stretch", sk: "Strečing lýtok pri stene", group: "Stretching", muscles: ["calves"], primary: ["calves"], secondary: [], equipment: "bodyweight", image: "Calf_Stretch_Hands_Against_Wall", aliases: ["strečing lýtok pri stene", "calf stretch"] },
  { id: "adductor", name: "Adductor Stretch", sk: "Strečing vnútornej strany stehien", group: "Stretching", muscles: ["adductors"], primary: ["adductors"], secondary: [], equipment: "foam roller", image: "Adductor", aliases: ["strečing vnútornej strany stehien", "adductor stretch"] },
  { id: "it_band_and_glute_stretch", name: "IT Band & Glute Stretch", sk: "Strečing vonkajšej strany stehna", group: "Stretching", muscles: ["glutes"], primary: ["glutes"], secondary: [], equipment: "other", image: "IT_Band_and_Glute_Stretch", aliases: ["strečing vonkajšej strany stehna", "it band & glute stretch"] },
  { id: "lying_glute", name: "Lying Glute Stretch", sk: "Strečing sedacích svalov v ľahu", group: "Stretching", muscles: ["glutes"], primary: ["glutes"], secondary: [], equipment: "bodyweight", image: "Lying_Glute", aliases: ["strečing sedacích svalov v ľahu", "lying glute stretch"] },
  { id: "seated_glute", name: "Seated Glute Stretch", sk: "Strečing sedacích svalov v sede", group: "Stretching", muscles: ["glutes", "adductors"], primary: ["glutes"], secondary: ["adductors"], equipment: "bodyweight", image: "Seated_Glute", aliases: ["strečing sedacích svalov v sede", "seated glute stretch"] },
  { id: "hug_knees_to_chest", name: "Knees to Chest", sk: "Kolená k hrudníku", group: "Stretching", muscles: ["lower back", "glutes"], primary: ["lower-back"], secondary: ["glutes"], equipment: "bodyweight", image: "Hug_Knees_To_Chest", aliases: ["kolená k hrudníku", "knees to chest"] },
  { id: "childs_pose", name: "Child's Pose", sk: "Pozícia dieťaťa", group: "Stretching", muscles: ["lower back", "glutes", "lats & upper back"], primary: ["lower-back"], secondary: ["glutes", "upper-back"], equipment: "bodyweight", image: "Childs_Pose", aliases: ["pozícia dieťaťa", "detská pozícia", "child's pose"] },
  { id: "cat_stretch", name: "Cat Stretch", sk: "Mačací chrbát", group: "Stretching", muscles: ["lower back", "lats & upper back", "traps"], primary: ["lower-back"], secondary: ["upper-back", "traps"], equipment: "bodyweight", image: "Cat_Stretch", aliases: ["mačací chrbát", "mačka", "cat stretch"] },
  { id: "spinal_stretch", name: "Spinal Twist", sk: "Rotácia chrbtice", group: "Stretching", muscles: ["lats & upper back", "lower back", "traps"], primary: ["upper-back"], secondary: ["lower-back", "traps"], equipment: "bodyweight", image: "Spinal_Stretch", aliases: ["rotácia chrbtice", "spinal twist"] },
  { id: "upper_back_stretch", name: "Upper Back Stretch", sk: "Strečing horného chrbta", group: "Stretching", muscles: ["lats & upper back"], primary: ["upper-back"], secondary: [], equipment: "bodyweight", image: "Upper_Back_Stretch", aliases: ["strečing horného chrbta", "upper back stretch"] },
  { id: "overhead_lat", name: "Overhead Lat Stretch", sk: "Strečing širokého chrbtového svalu", group: "Stretching", muscles: ["lats & upper back", "triceps"], primary: ["upper-back"], secondary: ["triceps"], equipment: "other", image: "Overhead_Lat", aliases: ["strečing širokého chrbtového svalu", "overhead lat stretch"] },
  { id: "chest_and_front_of_shoulder_stretch", name: "Chest & Shoulder Stretch", sk: "Strečing hrudníka a ramien", group: "Stretching", muscles: ["chest", "front delts"], primary: ["chest", "front-delts"], secondary: [], equipment: "other", image: "Chest_And_Front_Of_Shoulder_Stretch", aliases: ["strečing hrudníka a ramien", "chest & shoulder stretch"] },
  { id: "shoulder_stretch", name: "Shoulder Stretch", sk: "Strečing ramena (ruka cez hrudník)", group: "Stretching", muscles: ["rear delts"], primary: ["rear-delts"], secondary: [], equipment: "bodyweight", image: "Shoulder_Stretch", aliases: ["strečing ramena (ruka cez hrudník)", "shoulder stretch"] },
  { id: "triceps_stretch", name: "Triceps Stretch", sk: "Strečing tricepsu", group: "Stretching", muscles: ["triceps", "lats & upper back"], primary: ["triceps"], secondary: ["upper-back"], equipment: "bodyweight", image: "Triceps_Stretch", aliases: ["strečing tricepsu", "triceps stretch"] },
  { id: "standing_biceps_stretch", name: "Biceps Stretch", sk: "Strečing bicepsu", group: "Stretching", muscles: ["biceps", "chest", "shoulders"], primary: ["biceps"], secondary: ["chest", "delts"], equipment: "other", image: "Standing_Biceps_Stretch", aliases: ["strečing bicepsu", "biceps stretch"] },
  { id: "kneeling_forearm_stretch", name: "Forearm Stretch", sk: "Strečing predlaktí", group: "Stretching", muscles: ["forearms"], primary: ["forearms"], secondary: [], equipment: "bodyweight", image: "Kneeling_Forearm_Stretch", aliases: ["strečing predlaktí", "forearm stretch"] },
  { id: "side_neck_stretch", name: "Side Neck Stretch", sk: "Strečing krku do strany", group: "Stretching", muscles: ["traps"], primary: ["traps"], secondary: [], equipment: "bodyweight", image: "Side_Neck_Stretch", aliases: ["strečing krku do strany", "side neck stretch"] },
  { id: "standing_lateral_stretch", name: "Standing Side Stretch", sk: "Úklon do strany", group: "Stretching", muscles: ["obliques"], primary: ["obliques"], secondary: [], equipment: "bodyweight", image: "Standing_Lateral_Stretch", aliases: ["úklon do strany", "standing side stretch"] },
  { id: "worlds_greatest_stretch", name: "World's Greatest Stretch", sk: "Komplexný strečing (world's greatest stretch)", group: "Stretching", muscles: ["hamstrings", "calves", "glutes", "quads"], primary: ["hamstrings"], secondary: ["calves", "glutes", "quads"], equipment: "bodyweight", image: "Worlds_Greatest_Stretch", aliases: ["komplexný strečing (world's greatest stretch)", "world's greatest stretch"] },
  { id: "inchworm", name: "Inchworm", sk: "Húsenica", group: "Stretching", muscles: ["hamstrings"], primary: ["hamstrings"], secondary: [], equipment: "bodyweight", image: "Inchworm", aliases: ["húsenica", "inchworm"] },
  { id: "arm_circles", name: "Arm Circles", sk: "Krúženie rukami", group: "Stretching", muscles: ["shoulders"], primary: ["delts"], secondary: [], equipment: "bodyweight", image: "Arm_Circles", aliases: ["krúženie rukami", "arm circles"] },
  { id: "standing_toe_touches", name: "Standing Toe Touch", sk: "Predklon v stoji", group: "Stretching", muscles: ["hamstrings", "calves"], primary: ["hamstrings"], secondary: ["calves"], equipment: "bodyweight", image: "Standing_Toe_Touches", aliases: ["predklon v stoji", "dotyk špičiek", "standing toe touch"] },
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

/** The catalogue entry for a plan/session exercise: by id, else an exact name or alias match. */
export function findCatalogExercise(
  catalogId: string | undefined,
  name: string,
): CatalogExercise | undefined {
  const byId = catalogById(catalogId);
  if (byId) return byId;
  const n = normalize(name);
  if (!n) return undefined;
  return exerciseCatalog.find(
    (e) => normalize(e.name) === n || e.aliases.some((a) => normalize(a) === n),
  );
}

/** Filter the catalogue by name, muscles or aliases (Slovak included). */
export function searchCatalog(query: string): CatalogExercise[] {
  const q = normalize(query);
  if (!q) return exerciseCatalog;
  return exerciseCatalog.filter(
    (e) =>
      normalize(e.name).includes(q) ||
      normalize(e.sk).includes(q) ||
      e.muscles.some((m) => normalize(m).includes(q)) ||
      e.aliases.some((a) => normalize(a).includes(q)),
  );
}
