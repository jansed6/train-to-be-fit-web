import { Card } from "@/components/ui/Card";
import { findCatalogExercise } from "@/lib/exerciseCatalog";
import { formatTargets } from "@/lib/planTargets";
import { formatWeight } from "@/lib/format";
import type { ExerciseComparison } from "@/lib/compare";

export function ComparisonCard({ comparison }: { comparison: ExerciseComparison }) {
  const { exercise, status, sets } = comparison;
  const catalog = findCatalogExercise(exercise.catalogId, exercise.name);

  const isSkipped = status === "skipped";
  const isAdded = status === "added";
  const isUntracked = status === "untracked";

  return (
    <Card className={isSkipped ? "opacity-55" : ""}>
      <div className="mb-2">
        <span className="text-[17px] font-semibold">{exercise.name}</span>
        {catalog && <span className="text-[15px] text-muted"> · {catalog.sk}</span>}
        {isSkipped && <span className="ml-2 text-[13px] font-semibold text-warn">Skipped</span>}
        {isAdded && <span className="ml-2 text-[13px] font-semibold text-warn">Added</span>}
      </div>

      {!isAdded && !isUntracked && exercise.targets && (
        <div className="mb-2 text-sm text-muted">
          Plan: {formatTargets(exercise.targets)}
        </div>
      )}

      {!isSkipped && (
        <div className="flex flex-wrap gap-1.5">
          {isUntracked || isAdded
            ? exercise.sets.map((set, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-surface-2 px-2 py-1 text-[13px]"
                >
                  {formatWeight(set.weightKg)} kg × {set.reps}
                </div>
              ))
            : sets.map((setComparison, i) => {
                if (!setComparison.logged) {
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-dashed border-muted px-2 py-1 text-[13px] text-muted"
                    >
                      —
                    </div>
                  );
                }
                return (
                  <div
                    key={i}
                    className={`rounded-lg px-2 py-1 text-[13px] ${
                      setComparison.below
                        ? "bg-warn-bg text-warn"
                        : "bg-surface-2"
                    }`}
                  >
                    {formatWeight(setComparison.logged.weightKg)} kg × {setComparison.logged.reps}
                  </div>
                );
              })}
        </div>
      )}
    </Card>
  );
}
