import { SubCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { catalogById } from "@/lib/exerciseCatalog";
import { setTargets, withTargets } from "@/lib/planTargets";
import { TargetRows } from "./TargetRows";
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
          {catalog.sk} · {catalog.muscles.join(", ")}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TargetRows
            targets={setTargets(exercise)}
            onChange={(targets) => onChange(withTargets(targets))}
          />
        </div>
        <Button variant="danger" size="sm" onClick={onRemove}>
          ✕
        </Button>
      </div>
    </SubCard>
  );
}
