"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { savePlan, uid } from "@/lib/repo";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DayEditor } from "@/components/plan/DayEditor";
import type { PickedExercise } from "@/components/plan/ExercisePicker";
import type { Plan, PlanDay, Exercise } from "@/lib/types";

export function PlanEditor({ initial }: { initial?: Plan }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [days, setDays] = useState<PlanDay[]>(initial?.days ?? []);

  function addDay() {
    setDays((d) => [
      ...d,
      { id: uid(), name: `Day ${d.length + 1}`, exercises: [] },
    ]);
  }

  function setDayName(dayId: string, value: string) {
    setDays((d) => d.map((x) => (x.id === dayId ? { ...x, name: value } : x)));
  }

  function removeDay(dayId: string) {
    setDays((d) => d.filter((x) => x.id !== dayId));
  }

  function addCustomExercise(dayId: string) {
    setDays((d) =>
      d.map((x) =>
        x.id === dayId
          ? {
              ...x,
              exercises: [
                ...x.exercises,
                { id: uid(), name: "", sets: 3, reps: "10" },
              ],
            }
          : x,
      ),
    );
  }

  function addExercisesToDay(dayId: string, items: PickedExercise[]) {
    setDays((d) =>
      d.map((x) =>
        x.id === dayId
          ? {
              ...x,
              exercises: [
                ...x.exercises,
                ...items.map((it) => ({
                  id: uid(),
                  name: it.name,
                  sets: it.sets,
                  reps: it.reps,
                  catalogId: it.catalogId,
                })),
              ],
            }
          : x,
      ),
    );
  }

  function updateExercise(dayId: string, exId: string, patch: Partial<Exercise>) {
    setDays((d) =>
      d.map((x) =>
        x.id === dayId
          ? {
              ...x,
              exercises: x.exercises.map((e) =>
                e.id === exId ? { ...e, ...patch } : e,
              ),
            }
          : x,
      ),
    );
  }

  function removeExercise(dayId: string, exId: string) {
    setDays((d) =>
      d.map((x) =>
        x.id === dayId
          ? { ...x, exercises: x.exercises.filter((e) => e.id !== exId) }
          : x,
      ),
    );
  }

  const canSave = days.some((d) => d.exercises.some((e) => e.name.trim()));

  async function save() {
    const cleanedDays = days
      .map((d) => ({
        ...d,
        exercises: d.exercises.filter((e) => e.name.trim()),
      }))
      .filter((d) => d.exercises.length > 0);

    const plan: Plan = {
      id: initial?.id ?? uid(),
      name: name.trim() || "My plan",
      createdAt: initial?.createdAt ?? Date.now(),
      days: cleanedDays,
    };
    await savePlan(plan);
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Plan name">
        <Input
          placeholder="E.g. Full body 3× week"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      {days.map((day) => (
        <DayEditor
          key={day.id}
          day={day}
          onRename={(value) => setDayName(day.id, value)}
          onRemove={() => removeDay(day.id)}
          onAddExercises={(items) => addExercisesToDay(day.id, items)}
          onAddCustom={() => addCustomExercise(day.id)}
          onUpdateExercise={(exId, patch) => updateExercise(day.id, exId, patch)}
          onRemoveExercise={(exId) => removeExercise(day.id, exId)}
        />
      ))}

      <Button onClick={addDay}>+ Add day</Button>
      <Button variant="primary" block disabled={!canSave} onClick={save}>
        Save plan
      </Button>
    </div>
  );
}
