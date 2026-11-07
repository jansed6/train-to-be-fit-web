import { SubCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { catalogById } from "@/lib/exerciseCatalog";
import { setTargets, toRepTargets, toTimedTargets, withTargets } from "@/lib/planTargets";
import { cn } from "@/lib/cn";
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
  const timed = !!exercise.timed;

  function setTimed(next: boolean) {
    if (next === timed) return;
    const targets = setTargets(exercise);
    onChange({
      timed: next,
      ...withTargets(next ? toTimedTargets(targets) : toRepTargets(targets)),
    });
  }

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
      <div
        role="group"
        aria-label="Each set is"
        className="mb-2 inline-flex rounded-full bg-surface p-0.5 text-xs"
      >
        <ModeButton active={!timed} onClick={() => setTimed(false)}>
          Reps
        </ModeButton>
        <ModeButton active={timed} onClick={() => setTimed(true)}>
          Time
        </ModeButton>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TargetRows
            timed={timed}
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

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 font-semibold transition",
        active ? "bg-accent text-white" : "text-muted",
      )}
    >
      {children}
    </button>
  );
}
