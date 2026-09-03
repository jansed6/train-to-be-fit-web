import { cn } from "@/lib/cn";
import { inputClass } from "@/components/ui/Input";
import { formatWeight } from "@/lib/format";
import { parseWeight, type SetRow as SetRowData } from "@/lib/useActiveWorkout";

const WEIGHT_STEP = 2.5;
const REPS_STEP = 1;

export function SetRow({
  index,
  row,
  canConfirm,
  onChange,
  onConfirm,
}: {
  index: number;
  row: SetRowData;
  canConfirm: boolean;
  onChange: (patch: Partial<SetRowData>) => void;
  onConfirm: () => void;
}) {
  function stepWeight(delta: number) {
    const current = parseWeight(row.weight) ?? 0;
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    onChange({ weight: formatWeight(next), done: false, prefilled: false });
  }

  function stepReps(delta: number) {
    const current = parseInt(row.reps, 10) || 0;
    const next = Math.max(0, current + delta);
    onChange({ reps: String(next), done: false });
  }

  return (
    <div className="flex items-center gap-1.5 py-1.5">
      <span className="w-5 flex-none font-bold">{index + 1}</span>

      <Stepper onMinus={() => stepWeight(-WEIGHT_STEP)} onPlus={() => stepWeight(WEIGHT_STEP)}>
        <input
          className={cn(inputClass, "px-1 text-center", row.prefilled && "text-muted")}
          inputMode="decimal"
          placeholder="0"
          value={row.weight}
          onChange={(e) =>
            onChange({ weight: e.target.value, done: false, prefilled: false })
          }
        />
      </Stepper>

      <Stepper onMinus={() => stepReps(-REPS_STEP)} onPlus={() => stepReps(REPS_STEP)}>
        <input
          className={cn(inputClass, "px-1 text-center")}
          inputMode="numeric"
          placeholder="0"
          value={row.reps}
          onChange={(e) => onChange({ reps: e.target.value, done: false })}
        />
      </Stepper>

      <button
        onClick={onConfirm}
        disabled={!canConfirm}
        aria-label={row.done ? "Set done" : "Confirm set"}
        className={cn(
          "flex h-9 w-9 flex-none items-center justify-center rounded-full border-2 text-lg disabled:opacity-40",
          row.done
            ? "border-accent bg-accent text-white"
            : "border-hairline text-muted",
        )}
      >
        ✓
      </button>
    </div>
  );
}

function Stepper({
  onMinus,
  onPlus,
  children,
}: {
  onMinus: () => void;
  onPlus: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center gap-1">
      <StepButton label="Decrease" onClick={onMinus}>
        −
      </StepButton>
      {children}
      <StepButton label="Increase" onClick={onPlus}>
        +
      </StepButton>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-7 flex-none items-center justify-center rounded-lg bg-surface-2 text-lg font-bold text-accent active:scale-95"
    >
      {children}
    </button>
  );
}
