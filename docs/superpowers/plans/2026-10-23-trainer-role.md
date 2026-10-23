# Trainer Role Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Any user can invite a client by email, build plans in the client's account with per-set rep and weight targets, and review the client's workouts against those targets.

**Architecture:** Postgres (Supabase) enforces who sees what: a new `coachings` table, state changes only through `security definer` RPC functions, and plan/session policies that let an *active* trainer read a client's data and write only the plans they authored. On the client side, plans gain optional per-set targets. Every new workout stores a snapshot of the plan's targets and keeps only ticked sets. Pure functions in `lib/` compare a workout with its snapshot and feed new `/clients/...` pages.

**Tech Stack:** Next.js 14 App Router (client components), TypeScript, Tailwind, `@supabase/supabase-js`, SWR. New dev-only: `vitest` for unit tests, plus a throwaway local Postgres (Postgres.app binaries) for database tests.

**Spec:** `docs/superpowers/specs/2026-10-23-trainer-role-design.md` (Slovak). Mockups: `docs/superpowers/specs/2026-10-23-trainer-role/`. The chosen variants are workout detail **A, exercise cards** and plan editor **B, weight per set**.

## Global Constraints

- UI copy is English, like the rest of the app. Catalogue exercise names (`catalog.sk`) stay Slovak.
- No new runtime dependencies. The only addition is the dev dependency `vitest`.
- No server code and no API routes. Every access rule is enforced in the database, and hiding a button is never the only guard.
- `supabase/schema.sql` must stay **idempotent**. Eduard re-runs the whole file in the Supabase SQL editor on the live project, and the DB test harness runs it twice.
- Every query that returns "my" plans or sessions filters `user_id = current user`. This covers Home, History, progress and weight prefill. Client data is loaded only by the `/clients/...` pages.
- Old plans (only `sets` + `reps`) and old sessions (no `planId` or targets) keep working without any data migration.
- Weights are shown with `formatWeight`, with a dot decimal like `27.5`. Weight inputs also accept a comma, via `parseWeight`.
- Only ticked (✓) sets are saved, for every user and every workout.
- Invite matching relies on the email in the Supabase JWT. This assumes email confirmation stays on in Supabase Auth, which is the default.
- Commit style: `Area: what changed` (e.g. `Workout: save only ticked sets`), ending with the `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` line.
- Work happens on branch `trainer-role`.

## Review Focus

1. **A trainer's own screens with an active client.** Home, History, progress and the weight prefill must show only the trainer's own data, even though RLS now lets them read the client's rows. The test lives in Task 6 (`repo.test.ts`, scoping assertions).
2. **The trainer edits the plan after the client has trained.** Old workouts must still be compared with the targets they were done against. Tasks 2 and 4 cover this: the snapshot is stored at finish, and `compareSession` never reads the plan.
3. **Legacy and free-text rep targets** (`"8-10"`, `""`, `"AMRAP"`) must neither crash nor flag false misses. The prefill uses the lower bound, and when there is no number the reps are not compared (Tasks 1 and 4).
4. **A planned exercise is swiped away and then restored with Undo.** It must not also show up as "skipped". When it stays removed, it is skipped (Task 2).
5. **Invite email typed with capitals or spaces** (`"  Zuzka@Gmail.com "`) must still match the client's sign-in email (Task 5).

---

### Task 1: Per-set plan targets (model + helpers)

**Files:**
- Modify: `package.json` (add `"test": "vitest run"` and the dev dependency `vitest@3`)
- Create: `vitest.config.ts`
- Modify: `lib/types.ts`
- Create: `lib/planTargets.ts`
- Test: `lib/planTargets.test.ts`

**Interfaces:**
- Produces, in `lib/types.ts`:
  ```ts
  export interface SetTarget {
    /** Rep target kept as text so ranges like "8-10" survive. */
    reps: string;
    /** Recommended weight; absent = no weight target. */
    weightKg?: number;
  }
  // Exercise gains:   targets?: SetTarget[];   (sets/reps stay as the legacy shape, kept in sync)
  // Plan gains:       trainerId?: string;      (filled from plans.trainer_id, never stored in data)
  // SessionExercise gains: targets?: SetTarget[]; added?: boolean;
  // WorkoutSession gains:  planId?: string; dayId?: string;
  ```
- Produces, in `lib/planTargets.ts`:
  - `setTargets(ex: Pick<Exercise, "sets" | "reps" | "targets">): SetTarget[]`
  - `withTargets(targets: SetTarget[]): Pick<Exercise, "targets" | "sets" | "reps">`
  - `formatTargets(targets: SetTarget[]): string`
  - `repsLowerBound(reps: string): number | null`

- [ ] **Step 1: Install vitest and configure it**

Run `npm install --save-dev vitest@3`. Then add `"test": "vitest run"` to `scripts`. In `vitest.config.ts`, alias `@` to the repo root (matching the `@/*` path in `tsconfig.json`) and set `test.include` to `["lib/**/*.test.ts"]`.

- [ ] **Step 2: Write the failing tests** in `lib/planTargets.test.ts`

```ts
describe("setTargets", () => {
  it("expands a legacy exercise into identical sets", () => {
    expect(setTargets({ sets: 3, reps: "8-10" })).toEqual([{ reps: "8-10" }, { reps: "8-10" }, { reps: "8-10" }]);
  });
  it("prefers explicit targets", () => {
    const targets = [{ reps: "12", weightKg: 20 }, { reps: "10", weightKg: 25 }];
    expect(setTargets({ sets: 3, reps: "10", targets })).toEqual(targets);
  });
  it("never returns fewer than one set", () => {
    expect(setTargets({ sets: 0, reps: "10" })).toEqual([{ reps: "10" }]);
  });
});

describe("withTargets", () => {
  it("keeps the legacy sets/reps in sync", () => {
    expect(withTargets([{ reps: "12", weightKg: 20 }, { reps: "10" }]))
      .toEqual({ targets: [{ reps: "12", weightKg: 20 }, { reps: "10" }], sets: 2, reps: "12" });
  });
});

describe("formatTargets", () => {
  it.each([
    [[{ reps: "10", weightKg: 25 }, { reps: "10", weightKg: 25 }, { reps: "10", weightKg: 25 }], "3 × 10 · 25 kg"],
    [[{ reps: "12", weightKg: 20 }, { reps: "10", weightKg: 25 }, { reps: "8", weightKg: 27.5 }], "12/10/8 · 20–27.5 kg"],
    [[{ reps: "8-10" }, { reps: "8-10" }], "2 × 8-10"],
    [[{ reps: "" }], "1 × —"],
    [[], "—"],
  ])("%j -> %s", (targets, text) => expect(formatTargets(targets)).toBe(text));
});

describe("repsLowerBound", () => {
  it.each([["8-10", 8], ["12", 12], [" 6 ", 6], ["AMRAP", null], ["", null]])("%s -> %s", (reps, n) =>
    expect(repsLowerBound(reps)).toBe(n));
});
```

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `npm test`
Expected: FAIL, because `./planTargets` does not exist.

- [ ] **Step 4: Add the type changes in `lib/types.ts` and implement `lib/planTargets.ts`**

`formatTargets` works like this:
- All reps the same: show `N × reps`. Otherwise join the reps with `/`. An empty rep target shows as `—`.
- Weight part (only the sets that have one):
  - none: leave the weight part out,
  - all the same: ` · W kg`,
  - otherwise: ` · min–max kg`, using an en dash and `formatWeight`.

`repsLowerBound` returns the first integer in the text.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npm test`, then `npx tsc --noEmit`.
Expected: PASS, and no type errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/types.ts lib/planTargets.ts lib/planTargets.test.ts
git commit -m "Plans: per-set rep and weight targets (model)"
```

---

### Task 2: Workout logging: target prefill, ticked sets only, plan snapshot

**Files:**
- Create: `lib/workoutRows.ts` (pure logic moved out of the hook, plus the new rules)
- Test: `lib/workoutRows.test.ts`
- Modify: `lib/useActiveWorkout.ts` (state and effects only; it imports from `workoutRows`)
- Modify: `components/workout/SetRow.tsx` and `components/workout/ExerciseCard.tsx` (imports, target line)
- Modify: `app/workout/[planId]/[dayId]/page.tsx` (confirm before finishing)
- Modify: `lib/muscles.ts:73-81` (ignore exercises with no sets)
- Modify: `app/history/[id]/page.tsx` (skipped exercise shows "Skipped" instead of an empty card)
- Test: `lib/muscles.test.ts`

**Interfaces:**
- Consumes: `SetTarget`, `setTargets`, `repsLowerBound` (Task 1).
- Produces, in `lib/workoutRows.ts`:
  - `SetRow` (unchanged shape, moved), `parseWeight`, `isValidRow` (moved unchanged)
  - `interface ActiveExercise { id: string; name: string; catalogId?: string; targets: SetTarget[]; planned: boolean; rows: SetRow[] }`. This replaces `targetSets`/`targetReps`. `planned` means the exercise came from the plan day, and its `id` is the plan exercise id.
  - `type WeightsByKey = Map<string, number[]>`
  - `weightsFromSessions(sessions: WorkoutSession[]): WeightsByKey` (moved from the hook's effect)
  - `prefilledRows(ex: Pick<Exercise, "name" | "catalogId" | "sets" | "reps" | "targets">, weightsByKey: WeightsByKey): SetRow[]`
  - `uncheckedSetCount(exercises: ActiveExercise[]): number`
  - `buildSession(input: { id: string; planId: string; dayId: string; planDayName: string; startedAt: number; finishedAt: number; planned: Exercise[]; exercises: ActiveExercise[] }): WorkoutSession | null`

- [ ] **Step 1: Write the failing tests** in `lib/workoutRows.test.ts`

```ts
const weights: WeightsByKey = new Map([["id:squat", [80, 85]]]);

describe("prefilledRows", () => {
  it("prefills the trainer's per-set targets over last time's weights", () => {
    const rows = prefilledRows({ name: "Squat", catalogId: "squat", sets: 2, reps: "5",
      targets: [{ reps: "8-10", weightKg: 60 }, { reps: "6", weightKg: 62.5 }] }, weights);
    expect(rows).toEqual([
      { weight: "60", reps: "8", done: false, prefilled: true },
      { weight: "62.5", reps: "6", done: false, prefilled: true },
    ]);
  });
  it("falls back to last time's weights when a set has no weight target", () => {
    const rows = prefilledRows({ name: "Squat", catalogId: "squat", sets: 2, reps: "5" }, weights);
    expect(rows.map((r) => r.weight)).toEqual(["80", "85"]);
  });
  it("leaves reps empty when the target has no number", () => {
    expect(prefilledRows({ name: "Plank", sets: 1, reps: "AMRAP" }, new Map())[0].reps).toBe("");
  });
});

describe("buildSession", () => {
  const planned: Exercise[] = [
    { id: "p1", name: "Squat", catalogId: "squat", sets: 2, reps: "10", targets: [{ reps: "10", weightKg: 30 }, { reps: "10", weightKg: 30 }] },
    { id: "p2", name: "Lunge", sets: 3, reps: "12" },
    { id: "p3", name: "Row", sets: 1, reps: "10" },
  ];
  const row = (weight: string, reps: string, done: boolean) => ({ weight, reps, done, prefilled: false });
  const base = { id: "s1", planId: "plan", dayId: "day", planDayName: "Day B", startedAt: 1000, finishedAt: 61000, planned };

  it("keeps only ticked sets, snapshots targets, marks skipped and added", () => {
    const s = buildSession({ ...base, exercises: [
      { id: "p1", name: "Squat", catalogId: "squat", planned: true, targets: setTargets(planned[0]), rows: [row("30", "10", true), row("30", "10", false)] },
      { id: "p2", name: "Lunge", planned: true, targets: setTargets(planned[1]), rows: [row("8", "12", false)] },
      { id: "x1", name: "Plank", planned: false, targets: [{ reps: "1" }], rows: [row("0", "1", true)] },
      { id: "x2", name: "Curl", planned: false, targets: [{ reps: "10" }], rows: [row("10", "10", false)] },
    ] })!;
    expect(s).toMatchObject({ id: "s1", planId: "plan", dayId: "day", date: 1000, durationSeconds: 60 });
    expect(s.exercises.map((e) => [e.id, e.sets.length, e.added ?? false])).toEqual([
      ["p1", 1, false], ["p2", 0, false], ["x1", 1, true], ["p3", 0, false],
    ]);
    expect(s.exercises[0].targets).toEqual(planned[0].targets);
    expect(s.exercises[3].targets).toEqual([{ reps: "10" }]); // removed mid-workout -> skipped, legacy targets expanded
    expect(s.exercises[2].targets).toBeUndefined();
  });
  it("does not add a restored exercise twice", () => {
    const s = buildSession({ ...base, planned: [planned[0]], exercises: [
      { id: "p1", name: "Squat", planned: true, targets: setTargets(planned[0]), rows: [row("30", "10", true)] },
    ] })!;
    expect(s.exercises).toHaveLength(1);
  });
  it("returns null when nothing was ticked", () => {
    expect(buildSession({ ...base, exercises: [
      { id: "p1", name: "Squat", planned: true, targets: [], rows: [row("30", "10", false)] },
    ] })).toBeNull();
  });
});

describe("uncheckedSetCount", () => {
  it("counts every row that isn't ticked", () => {
    expect(uncheckedSetCount([{ id: "a", name: "A", planned: true, targets: [], rows: [
      { weight: "1", reps: "1", done: true, prefilled: false },
      { weight: "1", reps: "1", done: false, prefilled: true },
      { weight: "", reps: "", done: false, prefilled: false },
    ] }])).toBe(2);
  });
});
```

`lib/muscles.test.ts`:

```ts
it("sessionLevels ignores skipped exercises", () => {
  const levels = sessionLevels({ id: "s", date: 0, planDayName: "d", durationSeconds: 0, exercises: [
    { id: "a", name: "Barbell Back Squat", catalogId: "squat", sets: [{ setNumber: 1, weightKg: 50, reps: 5 }] },
    { id: "b", name: "Barbell Bench Press", catalogId: "bench_press", sets: [] },
  ] });
  expect(Object.keys(levels)).not.toContain("chest");
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test`
Expected: FAIL, because `./workoutRows` does not exist and `chest` is present in the levels.

- [ ] **Step 3: Implement `lib/workoutRows.ts`, then rewire the hook and the UI**

`prefilledRows` decides each set as follows:
- **Rows:** one row per `setTargets(ex)` entry.
- **Reps:** `String(repsLowerBound(t.reps) ?? "")`.
- **Weight**, first match wins:
  1. `formatWeight(t.weightKg)` if the target has a weight,
  2. otherwise last time's weight for that set index, or the last one available (today's rule),
  3. otherwise `"0"` for no-load catalogue moves (today's rule),
  4. otherwise empty.
- `prefilled` is true when the weight is not empty.

`buildSession` follows the tests:
- Logged sets are rows that are `done && isValidRow`.
- Planned exercises are always kept and carry `targets`.
- Added exercises are kept only when they have at least one set, and they carry `added: true`.
- Planned exercises that are missing from `exercises` are appended at the end with `sets: []` and `targets: setTargets(p)`.
- If no exercise has a set, it returns `null`.

Changes in `useActiveWorkout`:
- Keep the day's `Exercise[]` in a ref.
- Build planned `ActiveExercise`s with `planned: true` and `targets: setTargets(ex)`.
- `addExercises` builds them with `planned: false`.
- `finish()` calls `buildSession({ id: uid(), planId, dayId, …, finishedAt: Date.now() })` and saves the result only when it is non-null.

Other changes:
- `ExerciseCard` shows `Target: {formatTargets(exercise.targets)}`.
- In `sessionLevels`, `continue` when `ex.sets.length === 0`.
- On the History detail page, a card with no sets shows `Skipped` in muted text.

- [ ] **Step 4: Ask before finishing with unticked sets** in `app/workout/[planId]/[dayId]/page.tsx`

At the top of `finish()`, before the double-tap guard, compute `const unticked = uncheckedSetCount(exercises)`. If `unticked > 0`, call `window.confirm` with exactly this text, and return if the user cancels:

`` `${unticked} ${unticked === 1 ? "set isn't" : "sets aren't"} ticked and won't be saved. Finish anyway?` ``

- [ ] **Step 5: Run the tests and the type check**

Run: `npm test && npx tsc --noEmit`
Expected: all tests PASS, no type errors.

- [ ] **Step 6: Commit**

```bash
git add lib/workoutRows.ts lib/workoutRows.test.ts lib/useActiveWorkout.ts lib/muscles.ts lib/muscles.test.ts components/workout app/workout app/history
git commit -m "Workout: save only ticked sets, prefill plan targets, snapshot the plan"
```

---

### Task 3: Plan editor: rep and weight per set

**Files:**
- Create: `components/plan/TargetRows.tsx`
- Modify: `components/plan/ExerciseRow.tsx` (replace the Sets/Reps fields with `TargetRows`)
- Modify: `components/PlanEditor.tsx:32-45` (a new custom exercise gets `withTargets` of 3 × `{ reps: "10" }`)

**Interfaces:**
- Consumes: `setTargets`, `withTargets` (Task 1); `parseWeight` (Task 2); `formatWeight`.
- Produces: `TargetRows({ targets, onChange }: { targets: SetTarget[]; onChange: (targets: SetTarget[]) => void })`.

- [ ] **Step 1: Build `TargetRows`**

The layout follows mockup B in `trainer-plan-editor.html`:
- **Columns:** `Set | Reps | Weight (kg) | ✕`. Use the existing `inputClass` and `Field` styling.
- **Typing a weight:** keep the typed text in local state so that `27.` or `27,` survives while typing. Store `weightKg: parseWeight(text) ?? undefined`, which makes an empty field mean no target.
- **`+ Add set`:** copies the last set.
- **`✕`:** removes a set, but is disabled when only one set is left.

`ExerciseRow` renders `<TargetRows targets={setTargets(exercise)} onChange={(t) => onChange(withTargets(t))} />`.

- [ ] **Step 2: Type check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add components/plan components/PlanEditor.tsx
git commit -m "Plans: set reps and weight for each set in the editor"
```

---

### Task 4: Plan vs. actual comparison

**Files:**
- Create: `lib/compare.ts`
- Test: `lib/compare.test.ts`

**Interfaces:**
- Consumes: `repsLowerBound` (Task 1); the session fields from Task 1 and Task 2.
- Produces:
  ```ts
  export interface SetComparison { logged?: LoggedSet; target?: SetTarget; below: boolean }
  export type ExerciseStatus = "met" | "below" | "skipped" | "added" | "untracked";
  export interface ExerciseComparison { exercise: SessionExercise; status: ExerciseStatus; sets: SetComparison[] }
  export interface SessionComparison { tracked: boolean; exercises: ExerciseComparison[]; skipped: number; below: number }
  export function compareSession(session: WorkoutSession): SessionComparison;
  export function sessionStatusLabel(c: SessionComparison): string | null;
  ```

- [ ] **Step 1: Write the failing tests**

```ts
const set = (weightKg: number, reps: number, setNumber = 1) => ({ setNumber, weightKg, reps });
const session = (exercises: SessionExercise[], planId: string | undefined = "plan"): WorkoutSession =>
  ({ id: "s", date: 0, planDayName: "B", durationSeconds: 0, planId, dayId: planId && "d", exercises });

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
  const c = compareSession(session([{ id: "a", name: "Squat", sets: [set(50, 5)] }], undefined));
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
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test`
Expected: FAIL, because `./compare` does not exist.

- [ ] **Step 3: Implement `lib/compare.ts`**

Rules for planned exercises:
- **Pairing:** set *i* of the plan is compared with logged set *i*, up to the longer of the two lists.
- **Below target:** a planned set is below when one of these holds:
  - it has no logged set,
  - its `weightKg` is defined and the logged weight is lower,
  - `repsLowerBound(reps)` is not null and the logged reps are lower.
- **Extra sets:** logged sets beyond the plan are never below.
- **Status:** an exercise with no sets is `skipped` and gets `sets: []`.

`tracked` is `session.planId !== undefined`. The function never reads the plan itself.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/compare.ts lib/compare.test.ts
git commit -m "Workouts: compare a workout with the plan it was done against"
```

---

### Task 5: Database: coachings, RPCs and access policies (with DB tests)

**Files:**
- Modify: `supabase/schema.sql`
- Create: `supabase/tests/stub.sql`, `supabase/tests/run.sh`, `supabase/tests/coaching.test.sql`
- Modify: `package.json` (add `"test:db": "bash supabase/tests/run.sh"`)

**Interfaces:**
- Produces (SQL, all in `public`):
  - Table `coachings(id uuid pk default gen_random_uuid(), trainer_id uuid not null → auth.users on delete cascade, trainer_email text not null, client_email text not null check (client_email = lower(client_email)), client_name text, client_id uuid → auth.users on delete cascade, status text not null default 'pending' check in ('pending','active','declined','cancelled','ended'), created_at timestamptz not null default now())`
  - Unique partial indexes: `(client_id) where status = 'active'` and `(trainer_id, client_email) where status in ('pending','active')`.
  - `plans.trainer_id uuid references auth.users(id) on delete set null`, added with `add column if not exists`.
  - `is_active_trainer_of(p_client uuid) returns boolean`: `security definer`, `stable`. True when a coaching row has `trainer_id = auth.uid()`, `client_id = p_client` and `status = 'active'`.
  - RPCs. Each is `security definer` with `set search_path = public`, and execute is granted to `authenticated` only (revoked from `public` and `anon`). Each raises `exception '<code>'` exactly as listed:
    - `invite_client(p_email text, p_name text default null) returns uuid`:
      - email = `lower(trim(p_email))`, and `invalid_email` if it doesn't match `^[^@\s]+@[^@\s]+\.[^@\s]+$`,
      - `cannot_invite_self` if it equals `lower(auth.jwt()->>'email')`,
      - `already_invited` on a unique violation,
      - `trainer_email` is taken from the JWT, `client_name` is the trimmed name or null.
    - `respond_to_invite(p_id uuid, p_accept boolean) returns void`:
      - the row must be `pending` and its `client_email` must equal the caller's lowercased JWT email, else `invite_not_found`,
      - on accept: `already_has_trainer` if the caller already has an active coaching, otherwise `status = 'active'` and `client_id = auth.uid()`,
      - on decline: `status = 'declined'`.
    - `cancel_invite(p_id uuid) returns void`: the caller must be the trainer and the row must be `pending` (it becomes `cancelled`), else `invite_not_found`.
    - `end_coaching(p_id uuid) returns void`:
      - the row must be `active` and the caller must be the trainer or the client, else `coaching_not_found`,
      - it becomes `ended`, and in the same call `update plans set trainer_id = null where user_id = <client> and trainer_id = <trainer>`.
  - Policies. Drop the old `"own plans"` / `"own sessions"` first. Recreate each policy with `drop policy if exists` and then `create policy … to authenticated`:
    ```sql
    -- coachings: read only; every write goes through the RPCs above
    using (trainer_id = auth.uid() or client_id = auth.uid()
           or (status = 'pending' and client_email = lower(auth.jwt() ->> 'email')))
    -- plans: select
    using (user_id = auth.uid() or public.is_active_trainer_of(user_id))
    -- plans: insert (with check) / update (using + with check) / delete (using), all the same expression:
    (user_id = auth.uid() and trainer_id is null)
      or (trainer_id = auth.uid() and public.is_active_trainer_of(user_id))
    -- sessions: select
    using (user_id = auth.uid() or public.is_active_trainer_of(user_id))
    -- sessions: insert / update / delete
    user_id = auth.uid()
    ```

- [ ] **Step 1: Write the harness**

**`supabase/tests/stub.sql`** emulates the Supabase pieces the schema uses:
- schemas `auth` and `tests`,
- table `auth.users(id uuid primary key, email text)`,
- roles `anon` and `authenticated` (created if missing),
- usage on `public`/`auth`/`tests` for both roles, and Supabase's default privileges: `alter default privileges in schema public grant all on tables to anon, authenticated` and `… grant execute on functions to anon, authenticated`. The second one makes the anon check in scenario 11 meaningful, because the schema has to revoke it,
- `auth.uid()` and `auth.jwt()`, exactly as Supabase defines them:
  ```sql
  create or replace function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid $$;
  create or replace function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  ```
- test helpers, owned by `postgres` but not `security definer`, so that RLS still applies:
  - `tests.login(p_id uuid, p_email text) returns void` sets `request.jwt.claims` to `{"sub":…, "email":…, "role":"authenticated"}`,
  - `tests.expect_error(p_sql text, p_expected text, p_label text) returns void` runs `p_sql` and fails unless it raises an error whose message contains `p_expected` or whose SQLSTATE equals `p_expected`.

**`supabase/tests/run.sh`** (bash, `set -euo pipefail`):
- Finds the Postgres binaries in `$PG_BIN`, or else the directory of `initdb` on `PATH`, or else `/Applications/Postgres.app/Contents/Versions/latest/bin`.
- Creates a cluster with `initdb -U postgres -A trust` in a `mktemp -d` directory.
- Starts it with `pg_ctl -o "-p ${PG_TEST_PORT:-54329} -k '' -c listen_addresses=127.0.0.1"`. TCP only, because the temp path is too long for a Unix socket.
- Sets `trap` to stop the cluster and delete the directory on exit.
- Runs, in this order and with `psql -h 127.0.0.1 -U postgres -v ON_ERROR_STOP=1 -q -f`:
  1. `stub.sql`,
  2. `schema.sql` **twice** (proves idempotency),
  3. each `supabase/tests/*.test.sql`.
- Ends by printing `DB tests passed`.

- [ ] **Step 2: Write the failing DB test** `supabase/tests/coaching.test.sql`

Setup:
- As `postgres`, insert users **T** (trainer, `trainer@x.test`), **C** (client, `zuzka@gmail.com`), **S** (stranger) and **T2** (second trainer) into `auth.users`.
- `set role authenticated`.
- Each scenario switches identity with `tests.login(...)`.
- Each check is a `do $$ … assert …, '<label>'; $$` block, or a `tests.expect_error(...)` call.

Scenarios, in order:

1. **Invite matching.**
   - T calls `invite_client('  Zuzka@Gmail.com ', 'Manželka')`. The row's `client_email` is `'zuzka@gmail.com'` and the status is pending.
   - C sees exactly 1 coaching row and S sees 0.
2. **Invite errors.**
   - T inviting `trainer@x.test` → `cannot_invite_self`.
   - T inviting `zuzka@gmail.com` again → `already_invited`.
   - T inviting `not-an-email` → `invalid_email`.
3. **Pending gives no access.**
   - As C, insert 1 session and 1 own plan (both must succeed).
   - As T, both `select count(*) from sessions where user_id = C` and the same count for plans return 0.
   - As T, inserting a plan `(user_id = C, trainer_id = T)` → `42501`.
4. **Accept.**
   - C calls `respond_to_invite(id, true)` and the status becomes active.
   - T now counts 1 session and 1 plan of C.
   - S still counts 0 sessions of C.
5. **Trainer plans.**
   - T inserts a plan `(user_id = C, trainer_id = T)` successfully.
   - C reads it.
   - C runs `update plans set data = data where trainer_id = T` and `delete … where trainer_id = T`. Both affect 0 rows (check with `get diagnostics`).
   - C inserting a plan with `trainer_id = T` → `42501`.
   - T updating C's own plan (`trainer_id is null`) affects 0 rows.
6. **The trainer can't write sessions.**
   - As T: `insert into sessions (user_id = C, …)` → `42501`.
   - As T: `update sessions … where user_id = C` affects 0 rows.
7. **One trainer per client.**
   - T2 invites C successfully. This is not enumeration: the invite is created without revealing anything.
   - C accepting T2's invite → `already_has_trainer`.
8. **Strangers can't act.**
   - S calls `end_coaching(<T–C id>)` → `coaching_not_found`.
   - S calls `cancel_invite(<T2 invite id>)` → `invite_not_found`.
9. **Ending.**
   - C calls `end_coaching`. T then counts 0 sessions and 0 plans of C.
   - The plan T built now has `trainer_id is null`, and C can update it (1 row).
10. **Re-invite and cancel.**
    - T invites C again successfully.
    - T calls `cancel_invite` on it, after which C sees no pending row from T.
    - C calling `respond_to_invite` on the cancelled id → `invite_not_found`.
11. **Anon has no access.**
    - As `anon`, with no claims set, `select count(*)` from plans, sessions and coachings is 0.
    - `invite_client` raises a permission error (`42501`).

- [ ] **Step 3: Run it and confirm it fails**

Run: `npm run test:db`
Expected: FAIL in scenario 1, because the function `invite_client` does not exist.

- [ ] **Step 4: Extend `supabase/schema.sql`**

Implement exactly the Interfaces above. Make the existing statements idempotent: `create policy` becomes `drop policy if exists` followed by `create policy`. Update the header comment to say "run the whole file again after pulling changes".

- [ ] **Step 5: Run the DB tests and confirm they pass**

Run: `npm run test:db`
Expected: `DB tests passed`.

- [ ] **Step 6: Commit**

```bash
git add supabase package.json
git commit -m "Database: coachings, trainer access policies and DB tests"
```

---

### Task 6: Data access: own-data scoping, client data, coaching API

**Files:**
- Modify: `lib/repo.ts`, `lib/hooks.ts`, `lib/auth.tsx`
- Create: `lib/coaching.ts`
- Test: `lib/repo.test.ts`, `lib/coaching.test.ts`

**Interfaces:**
- Consumes: the RPCs and columns from Task 5; `Plan.trainerId` from Task 1.
- Produces:
  - `lib/repo.ts`:
    - `planFromRow(row: { data: Plan; trainer_id: string | null }): Plan`
    - `getAllPlans()` and `getAllSessions()`, now filtered by `.eq("user_id", me)`
    - `getPlan(id)` now also reads `trainer_id`
    - `savePlan(plan)` never writes `trainerId` into `data`
    - `saveClientPlan(clientId: string, plan: Plan): Promise<void>`, which upserts `{ id, user_id: clientId, trainer_id: me, data, created_at }`
    - `deleteClientPlan(clientId: string, id: string): Promise<void>`
    - `getClientPlans(clientId: string): Promise<Plan[]>` (filters `user_id = clientId` and `trainer_id = me`)
    - `getClientSessions(clientId: string): Promise<WorkoutSession[]>` (filters `user_id = clientId`, newest first)
  - `lib/hooks.ts`:
    - `useClientPlans(clientId)` with SWR key `["client-plans", clientId]`
    - `useClientSessions(clientId)` with SWR key `["client-sessions", clientId]`
    - `useCoachings()` with SWR key `"coachings"`
    - `useClient(clientId): Coaching | null | undefined`, the active coaching where I'm the trainer
  - `lib/auth.tsx`: `useMyUserId(): string | undefined`
  - `lib/coaching.ts`:
    - `type CoachingStatus`
    - `interface Coaching { id; trainerId; trainerEmail; clientEmail; clientName: string | null; clientId: string | null; status: CoachingStatus; createdAt: number }`
    - `coachingFromRow`, `getCoachings`
    - `inviteClient(email: string, name: string)`, `respondToInvite(id: string, accept: boolean)`, `cancelInvite(id: string)`, `endCoaching(id: string)`. Each revalidates `"coachings"`, and `endCoaching` also revalidates `"plans"`.
    - `clientLabel(c: Coaching): string`, which returns `clientName || clientEmail`
    - selectors `myClients(all, me)`, `myPendingInvites(all, me)`, `invitesForMe(all, me)`, `myTrainer(all, me)`
    - `coachingErrorMessage(err: unknown): string`

- [ ] **Step 1: Write the failing tests**

`lib/repo.test.ts` mocks `./supabase`:
- `vi.mock("./supabase", …)` returns a fake whose `from(table)` hands back a chainable builder.
- The builder records every `eq(col, val)` and `upsert(row)` and resolves to `{ data: [], error: null }`.
- `auth.getUser()` resolves to `{ data: { user: { id: "me" } } }`.

```ts
it("own lists are scoped to the signed-in user", async () => {
  await getAllSessions();
  await getAllPlans();
  expect(calls.eq).toEqual([["sessions", "user_id", "me"], ["plans", "user_id", "me"]]);
});
it("client plans are scoped to the client and to plans I wrote", async () => {
  await getClientPlans("c1");
  expect(calls.eq).toEqual([["plans", "user_id", "c1"], ["plans", "trainer_id", "me"]]);
});
it("saveClientPlan writes the client as owner and me as trainer, not into data", async () => {
  await saveClientPlan("c1", { id: "p", name: "P", createdAt: 0, days: [], trainerId: "me" });
  expect(calls.upsert[0]).toMatchObject({ table: "plans", row: { id: "p", user_id: "c1", trainer_id: "me" } });
  expect(calls.upsert[0].row.data).not.toHaveProperty("trainerId");
});
it("planFromRow exposes the trainer", () => {
  expect(planFromRow({ data: { id: "p", name: "P", createdAt: 0, days: [] }, trainer_id: "t" }).trainerId).toBe("t");
});
```

`lib/coaching.test.ts`:

```ts
const row = (o: Partial<Coaching>): Coaching => ({ id: "1", trainerId: "t", trainerEmail: "t@x", clientEmail: "c@x", clientName: null, clientId: null, status: "pending", createdAt: 0, ...o });
it("selectors split coachings by role and status", () => {
  const all = [row({ id: "a", status: "active", clientId: "c" }), row({ id: "p" }), row({ id: "in", trainerId: "other", clientEmail: "t@x" }),
               row({ id: "mine", trainerId: "other", clientId: "t", status: "active" }), row({ id: "old", status: "ended", clientId: "c" })];
  expect(myClients(all, "t").map((c) => c.id)).toEqual(["a"]);
  expect(myPendingInvites(all, "t").map((c) => c.id)).toEqual(["p"]);
  expect(invitesForMe(all, "t").map((c) => c.id)).toEqual(["in"]);
  expect(myTrainer(all, "t")?.id).toBe("mine");
});
it.each([
  ["cannot_invite_self", "You can't invite yourself."],
  ["already_invited", "You've already invited this email."],
  ["already_has_trainer", "You already have a trainer. End that coaching first to accept a new one."],
  ["invalid_email", "Enter a valid email."],
  ["boom", "Something went wrong. Try again."],
])("%s -> message", (code, text) => expect(coachingErrorMessage({ message: code })).toBe(text));
it("clientLabel prefers the trainer's name for the client", () => {
  expect(clientLabel(row({ clientName: "Manželka" }))).toBe("Manželka");
  expect(clientLabel(row({}))).toBe("c@x");
});
```

`invitesForMe` filters on `pending` with a trainer other than me. RLS already limits those rows to invites addressed to my email.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test`
Expected: FAIL, because the functions don't exist and the scoping calls are missing.

- [ ] **Step 3: Implement the repo, coaching and hook changes as listed in Interfaces**

- [ ] **Step 4: Run all checks**

Run: `npm test && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib
git commit -m "Data: scope own lists to the user, add client data and coaching API"
```

---

### Task 7: Client side: invite banner, trainer plans read-only, nav

**Files:**
- Create: `components/clients/InviteBanner.tsx`
- Modify: `app/page.tsx` (render `InviteBanner` above the stats)
- Modify: `components/home/PlanCard.tsx`, `app/plans/[id]/page.tsx`
- Modify: `components/NavBar.tsx`, `components/TopNav.tsx`

**Interfaces:**
- Consumes: `useCoachings`, `useMyUserId`, `invitesForMe`, `respondToInvite`, `coachingErrorMessage` (Task 6); `Plan.trainerId`.

- [ ] **Step 1: Build `InviteBanner`**

For each `invitesForMe` invite, show a `Card` with the text `{trainerEmail} wants to be your trainer` and the buttons **Accept** (primary) and **Decline** (ghost). Show errors with `coachingErrorMessage`, in the same `text-sm text-red-500` style as `SignIn`. Disable the buttons while a request is running.

- [ ] **Step 2: Make trainer plans read-only**

`PlanCard`:
- When `plan.trainerId` is set, hide Edit and Delete.
- Show the muted label `From your trainer` next to the name instead.

`app/plans/[id]/page.tsx`: when the loaded plan has `trainerId`, render `<p className="text-muted">This plan is from your trainer, so only they can change it.</p>` instead of the editor.

- [ ] **Step 3: Add Clients to the nav**

`NavBar` and `TopNav` get three links: Home, History and Clients (`/clients`).
- Clients is active on `path.startsWith("/clients")`.
- History is active on `/history`.
- Home is active otherwise.

- [ ] **Step 4: Type check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 5: Commit**

```bash
git add components app
git commit -m "Clients: invite banner, read-only trainer plans, Clients in nav"
```

---

### Task 8: Clients page

**Files:**
- Create: `app/clients/page.tsx`, `components/clients/InviteForm.tsx`

**Interfaces:**
- Consumes: `useCoachings`, `useMyUserId`, `myClients`, `myPendingInvites`, `myTrainer`, `inviteClient`, `cancelInvite`, `endCoaching`, `clientLabel`, `coachingErrorMessage` (Task 6).

- [ ] **Step 1: Build the page**

Page title: `Clients`. Sections, top to bottom (an empty section is hidden):
1. **Your trainer** (when `myTrainer` is set): shows the trainer's email and an `End coaching` button (danger, behind `confirm("Stop being coached by {email}?")`).
2. **`InviteForm`**:
   - an email input (`type="email"`, required) and an optional `Name (optional)` input,
   - the `Invite` button,
   - on success, clear the fields and show `Invite sent. It'll appear when they sign in with this email.`,
   - on error, show `coachingErrorMessage`.
3. **Clients**: one card per `myClients` entry. It shows `clientLabel` and links to `/clients/{clientId}`. It has an `End` button behind `confirm("End coaching {label}? You'll lose access to their workouts.")`.
4. **Pending invites**: each shows the email (and the name), with a `Cancel` button.

- [ ] **Step 2: Type check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add app/clients components/clients
git commit -m "Clients: invite, list and end coaching"
```

---

### Task 9: Client profile (overview)

**Files:**
- Create: `lib/clientStats.ts`
- Test: `lib/clientStats.test.ts`
- Create: `app/clients/[clientId]/page.tsx`, `components/clients/WeekStrip.tsx`, `components/clients/ClientSessionRow.tsx`
- Modify: `app/page.tsx` (use `startOfWeekMs(new Date())` from `lib/clientStats.ts` and delete the local copy)

**Interfaces:**
- Consumes: `compareSession`, `sessionStatusLabel` (Task 4); `useClient`, `useClientPlans`, `useClientSessions`, `deleteClientPlan`, `clientLabel` (Task 6).
- Produces:
  - `startOfWeekMs(now: Date): number`
  - `countSince(sessions: WorkoutSession[], sinceMs: number): number`
  - `interface WeekDay { label: string; trained: boolean; offPlan: boolean }`
  - `weekStrip(sessions: WorkoutSession[], now: Date): WeekDay[]`, which returns Mon..Sun of the current local week, labels `Mon`…`Sun`, and sets `offPlan` when any of that day's sessions has `skipped + below > 0`

- [ ] **Step 1: Write the failing tests**

```ts
const wed = new Date(2026, 9, 21, 18, 0); // Wed 21 Oct 2026, local time
const at = (d: number, h = 10) => new Date(2026, 9, d, h).getTime();
const s = (date: number, exercises: SessionExercise[] = [], planId?: string): WorkoutSession =>
  ({ id: String(date), date, planDayName: "A", durationSeconds: 0, exercises, planId });

it("week starts on Monday", () => expect(startOfWeekMs(wed)).toBe(new Date(2026, 9, 19).getTime()));
it("counts sessions since a moment", () => expect(countSince([s(at(18)), s(at(19)), s(at(21))], startOfWeekMs(wed))).toBe(2));
it("week strip marks trained and off-plan days", () => {
  const skipped = s(at(21), [{ id: "x", name: "Lunge", sets: [], targets: [{ reps: "12" }] }], "plan");
  const strip = weekStrip([s(at(19)), skipped, s(at(12))], wed);
  expect(strip.map((d) => d.label)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  expect(strip.map((d) => d.trained)).toEqual([true, false, true, false, false, false, false]);
  expect(strip.map((d) => d.offPlan)).toEqual([false, false, true, false, false, false, false]);
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test`
Expected: FAIL, because `./clientStats` does not exist.

- [ ] **Step 3: Implement `lib/clientStats.ts` and switch Home to it**

- [ ] **Step 4: Build the page**

Layout: mockup `trainer-progress.html`, left phone.
- **Loading:** `useClient(clientId)` returning `null` renders `Client not found.`
- **Header:**
  - `BackLink` to `/clients`,
  - `PageTitle` with `clientLabel`,
  - a muted line with the names of my plans for this client, or `No plan yet`.
- **Stats:** two `StatTile`s, `this week` and `last 30 days`.
- **Week:** `WeekStrip` uses an accent dot for trained days and `--accent-light` for off-plan days.
- **Plans:** each plan has `Edit` (→ `/clients/{id}/plans/{planId}`) and `Delete` (behind a confirm). Add a `+ New plan` button (→ `/clients/{id}/plans/new`).
- **Workouts:** `ClientSessionRow` shows the day name, then `formatDate · formatDuration`. On the right goes the `sessionStatusLabel`: green-ish for `✓`, warning colour otherwise, and nothing when it is null. The row links to `/clients/{id}/workouts/{sessionId}`.
- **`Exercise progress` button:** goes to `/clients/{id}/progress`.

- [ ] **Step 5: Run all checks**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all succeed.

- [ ] **Step 6: Commit**

```bash
git add lib/clientStats.ts lib/clientStats.test.ts app components/clients
git commit -m "Clients: client overview with week, stats and workout status"
```

---

### Task 10: Client workout detail (exercise cards)

**Files:**
- Create: `app/clients/[clientId]/workouts/[sessionId]/page.tsx`, `components/clients/ComparisonCard.tsx`

**Interfaces:**
- Consumes: `compareSession`, `ExerciseComparison` (Task 4); `formatTargets` (Task 1); `useClientSessions`, `useClient` (Task 6).
- Produces: `ComparisonCard({ comparison }: { comparison: ExerciseComparison })`.

- [ ] **Step 1: Build the page and the card**

Layout: mockup `trainer-progress.html`, variant A.
- **Page:**
  - `BackLink` to `/clients/{clientId}`,
  - title `planDayName`,
  - a muted line with `formatDate · formatDuration`,
  - one `ComparisonCard` per entry of `compareSession(session).exercises`, in stored order.
  - Look the session up by id in `useClientSessions(clientId)`, so a URL can't show someone else's workout. Show `Workout not found.` when it isn't there.
- **Every card:** the name, plus `catalog.sk` when present.
- **By status:**
  - `skipped`: a dimmed card (`opacity-55`) with the tag `Skipped` and the line `Plan: {formatTargets(targets)}`, without chips.
  - `added`: the tag `Added` and logged chips, without a plan line.
  - `untracked`: logged chips only.
  - `met` / `below`: the plan line, then one chip per `SetComparison`:
    - a logged set shows `{formatWeight(w)} kg × {reps}`,
    - a missing planned set shows a dashed chip `—`,
    - a chip with `below` uses the warning style (light orange background with dark orange text, as in the mockup).

- [ ] **Step 2: Type check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add app/clients components/clients
git commit -m "Clients: workout detail with plan vs. actual per exercise"
```

---

### Task 11: Client plan editor routes

**Files:**
- Modify: `components/PlanEditor.tsx` (optional prop `clientId`)
- Create: `app/clients/[clientId]/plans/new/page.tsx`, `app/clients/[clientId]/plans/[planId]/page.tsx`

**Interfaces:**
- Consumes: `saveClientPlan` (Task 6); `usePlan` (existing); `useClient` (Task 6).
- Produces: `PlanEditor({ initial, clientId }: { initial?: Plan; clientId?: string })`. With `clientId` it saves via `saveClientPlan(clientId, plan)` and navigates to `/clients/{clientId}`. Without it, it behaves as it does today.

- [ ] **Step 1: Wire the prop and build both pages**

Both pages use `BackLink` to the client, with the title `New plan for {label}` / `Edit plan`. They show `Client not found.` when `useClient` returns `null`. The edit page shows `Plan not found.` unless the plan's `trainerId` is me. There are no starter plans on the new page.

- [ ] **Step 2: Type check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add components/PlanEditor.tsx app/clients
git commit -m "Clients: build and edit plans in a client's account"
```

---

### Task 12: Client exercise progress

**Files:**
- Create: `components/progress/ExerciseProgressList.tsx` (extracted from `app/history/page.tsx:43-65`)
- Create: `components/progress/ProgressDetail.tsx` (moved from `app/progress/[slug]/page.tsx:40-61`)
- Modify: `app/history/page.tsx`, `app/progress/[slug]/page.tsx` (use the extracted components; behaviour unchanged)
- Create: `app/clients/[clientId]/progress/page.tsx`, `app/clients/[clientId]/progress/[slug]/page.tsx`

**Interfaces:**
- Consumes: `exerciseSummaries`, `summaryForSlug` (existing); `useClientSessions`, `useClient` (Task 6).
- Produces:
  - `ExerciseProgressList({ sessions, hrefFor }: { sessions: WorkoutSession[]; hrefFor: (slug: string) => string })`
  - `ProgressDetail({ summary }: { summary: ExerciseSummary })`

- [ ] **Step 1: Extract the components and use them in the History and Progress pages**

- [ ] **Step 2: Build the client progress pages**

The list page:
- `BackLink` to the client and the title `Exercise progress`,
- `ExerciseProgressList` with `hrefFor = (slug) => /clients/{id}/progress/{encodeURIComponent(slug)}`,
- `No workouts yet.` when it is empty.

The detail page mirrors `/progress/[slug]`, using the client's sessions.

- [ ] **Step 3: Type check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add components/progress app
git commit -m "Clients: exercise progress charts for a client"
```

---

### Task 13: Docs and final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update `README.md`**

- **Features:** add a short paragraph on the trainer role.
- **Run locally:**
  - add `npm test` (unit tests),
  - add `npm run test:db` (DB tests; needs local Postgres binaries such as Postgres.app, or `PG_BIN`).
- **Setup:** state that after pulling these changes, the whole `supabase/schema.sql` must be run again in the Supabase SQL editor.

- [ ] **Step 2: Run everything**

Run: `npm test && npm run test:db && npx tsc --noEmit && npm run build`
Expected: all pass, and `DB tests passed` is printed.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "README: trainer role, tests, re-run schema"
```

- [ ] **Step 4: Hand Eduard the manual acceptance check**

The implementer can't sign in to the live Supabase project, so tell Eduard plainly that this part is his. Steps:
1. Run `supabase/schema.sql` in the Supabase SQL editor.
2. In his own account (on `npm run dev`), go to Clients and invite his wife's email.
3. In her account, accept the invite on Home.
4. As Eduard, open her profile, use `+ New plan` and set per-set reps and weights.
5. As her, start that plan:
   - check that the weights are prefilled,
   - tick only some sets,
   - swipe one exercise away,
   - then Finish. The "N sets aren't ticked" question must appear.
6. As Eduard, check that:
   - the workout count is 1,
   - the row shows the skipped / below-target status,
   - the detail shows the skipped card and orange chips.
7. As her, check that the trainer plan has no Edit or Delete.
8. As her, go to Clients → End coaching. Eduard should lose access, and the plan should become editable for her.
