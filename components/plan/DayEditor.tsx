"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ExerciseRow } from "./ExerciseRow";
import { ExercisePicker, type PickedExercise } from "./ExercisePicker";
import type { PlanDay, Exercise } from "@/lib/types";

export function DayEditor({
  day,
  onRename,
  onRemove,
  onAddExercises,
  onAddCustom,
  onUpdateExercise,
  onRemoveExercise,
}: {
  day: PlanDay;
  onRename: (name: string) => void;
  onRemove: () => void;
  onAddExercises: (items: PickedExercise[]) => void;
  onAddCustom: () => void;
  onUpdateExercise: (exId: string, patch: Partial<Exercise>) => void;
  onRemoveExercise: (exId: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <Card>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <Input
          className="font-bold"
          value={day.name}
          onChange={(e) => onRename(e.target.value)}
        />
        <Button variant="danger" size="sm" onClick={onRemove}>
          ✕
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        {day.exercises.map((ex) => (
          <ExerciseRow
            key={ex.id}
            exercise={ex}
            onChange={(patch) => onUpdateExercise(ex.id, patch)}
            onRemove={() => onRemoveExercise(ex.id)}
          />
        ))}

        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setShowPicker(true)}>
            + Add exercise
          </Button>
          <Button variant="ghost" size="sm" onClick={onAddCustom}>
            + Custom
          </Button>
        </div>
      </div>

      {showPicker && (
        <ExercisePicker
          onAdd={onAddExercises}
          onClose={() => setShowPicker(false)}
        />
      )}
    </Card>
  );
}
