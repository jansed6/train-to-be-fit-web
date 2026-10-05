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
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  exercise: ActiveExercise;
  onChangeRow: (rowIdx: number, patch: Partial<SetRowData>) => void;
  onConfirmRow: (rowIdx: number) => void;
  onAddSet: () => void;
  /** Omitted when the exercise is already first / last. */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
}) {
  const catalog = catalogById(exercise.catalogId);

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[20px] font-bold">{exercise.name}</div>
        <div className="flex flex-none items-center gap-1">
          <IconButton label="Move up" onClick={onMoveUp}>
            ↑
          </IconButton>
          <IconButton label="Move down" onClick={onMoveDown}>
            ↓
          </IconButton>
          <IconButton label="Remove exercise" danger onClick={onRemove}>
            ✕
          </IconButton>
        </div>
      </div>
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

function IconButton({
  label,
  danger = false,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-base font-bold active:scale-95 disabled:opacity-30",
        danger ? "text-red-500" : "text-accent",
      )}
    >
      {children}
    </button>
  );
}
