import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SetRow } from "./SetRow";
import { catalogById } from "@/lib/exerciseCatalog";
import { cn } from "@/lib/cn";
import { isValidRow, type ActiveExercise, type SetRow as SetRowData } from "@/lib/useActiveWorkout";

export function ExerciseCard({
  exercise,
  onChangeRow,
  onConfirmRow,
  onAddSet,
}: {
  exercise: ActiveExercise;
  onChangeRow: (rowIdx: number, patch: Partial<SetRowData>) => void;
  onConfirmRow: (rowIdx: number) => void;
  onAddSet: () => void;
}) {
  const catalog = catalogById(exercise.catalogId);

  return (
    <Card>
      <div className="text-[20px] font-bold">{exercise.name}</div>
      <div className="mb-3 text-sm text-muted">
        Target: {exercise.targetSets}×{exercise.targetReps || "—"}
        {catalog ? ` · ${catalog.muscles.join(", ")}` : ""}
      </div>

      <div className="flex gap-1.5 text-xs text-muted">
        <span className="w-5 flex-none">Set</span>
        <span className="flex-1 text-center">kg</span>
        <span className="flex-1 text-center">Reps</span>
        <span className="w-9 flex-none" />
      </div>

      {exercise.rows.map((row, j) => (
        <SetRow
          key={j}
          index={j}
          row={row}
          canConfirm={isValidRow(row)}
          onChange={(patch) => onChangeRow(j, patch)}
          onConfirm={() => onConfirmRow(j)}
        />
      ))}

      <Button variant="ghost" size="sm" className="mt-2" onClick={onAddSet}>
        + Add set
      </Button>
    </Card>
  );
}

/** One-line version of the card, shown while exercises are being reordered. */
export function ExerciseCardCompact({
  exercise,
  lifted,
}: {
  exercise: ActiveExercise;
  lifted: boolean;
}) {
  const done = exercise.rows.filter((r) => r.done).length;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-card border border-hairline bg-surface px-4 py-3 shadow-card transition-transform",
        lifted && "scale-[1.03] border-accent shadow-xl",
      )}
    >
      <span className="text-lg leading-none text-muted" aria-hidden>
        ≡
      </span>
      <span className="min-w-0 flex-1 truncate font-semibold">{exercise.name}</span>
      <span className="flex-none text-sm text-muted">
        {done}/{exercise.rows.length} sets
      </span>
    </div>
  );
}
