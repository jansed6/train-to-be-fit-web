import { cn } from "@/lib/cn";
import { inputClass } from "@/components/ui/Input";
import { formatDuration, formatWeight, parseDuration } from "@/lib/format";
import { parseWeight, type SetRow as SetRowData } from "@/lib/workoutRows";

const WEIGHT_STEP = 1;
const REPS_STEP = 1;
const TIME_STEP = 5;

export function SetRow({
  index,
  row,
  timed = false,
  canConfirm,
  onChange,
  onConfirm,
}: {
  index: number;
  row: SetRowData;
  /** The second column is the set's time instead of its reps. */
  timed?: boolean;
  canConfirm: boolean;
  onChange: (patch: Partial<SetRowData>) => void;
  onConfirm: () => void;
}) {
  function stepTime(delta: number) {
    const current = parseDuration(row.time ?? "") ?? 0;
    onChange({ time: formatDuration(Math.max(0, current + delta)), done: false });
  }

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
          className={cn(inputClass, "select-text px-1 text-center", row.prefilled && "text-muted")}
          inputMode="decimal"
          placeholder="0"
          value={row.weight}
          onChange={(e) =>
            onChange({ weight: e.target.value, done: false, prefilled: false })
          }
        />
      </Stepper>

      {timed ? (
        <Stepper onMinus={() => stepTime(-TIME_STEP)} onPlus={() => stepTime(TIME_STEP)}>
          <input
            // "0:45" needs the room: inputClass's px-3 would clip it on a phone.
            className={cn(inputClass, "select-text !px-0.5 text-center tabular-nums")}
            inputMode="numeric"
            placeholder="0:00"
            aria-label={`Set ${index + 1} time`}
            value={row.time ?? ""}
            onChange={(e) => onChange({ time: e.target.value, done: false })}
          />
        </Stepper>
      ) : (
        <Stepper onMinus={() => stepReps(-REPS_STEP)} onPlus={() => stepReps(REPS_STEP)}>
          <input
            className={cn(inputClass, "select-text px-1 text-center")}
            inputMode="numeric"
            placeholder="0"
            value={row.reps}
            onChange={(e) => onChange({ reps: e.target.value, done: false })}
          />
        </Stepper>
      )}

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
