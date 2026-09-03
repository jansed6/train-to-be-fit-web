import { SubCard } from "@/components/ui/Card";
import { Input, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { catalogById } from "@/lib/exerciseCatalog";
import type { Exercise } from "@/lib/types";

export function ExerciseRow({
  exercise,
  onChange,
  onRemove,
}: {
  exercise: Exercise;
  onChange: (patch: Partial<Exercise>) => void;
  onRemove: () => void;
}) {
  const catalog = catalogById(exercise.catalogId);

  return (
    <SubCard>
      <Input
        className={catalog ? "" : "mb-2"}
        placeholder="Exercise name"
        value={exercise.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      {catalog && (
        <div className="mb-2 mt-1 text-xs text-muted">
          {catalog.muscles.join(", ")}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Field label="Sets">
            <Input
              type="number"
              min={1}
              max={20}
              value={exercise.sets}
              onChange={(e) =>
                onChange({ sets: Math.max(1, Number(e.target.value) || 1) })
              }
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Reps">
            <Input
              placeholder="8-10"
              value={exercise.reps}
              onChange={(e) => onChange({ reps: e.target.value })}
            />
          </Field>
        </div>
        <Button variant="danger" size="sm" onClick={onRemove}>
          ✕
        </Button>
      </div>
    </SubCard>
  );
}
