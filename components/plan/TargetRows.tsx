import { useState, useEffect, Fragment } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { parseWeight } from "@/lib/workoutRows";
import { formatDuration, formatWeight, parseDuration } from "@/lib/format";
import type { SetTarget } from "@/lib/types";

/** Keeps the typed text of number inputs ("27." or "1:" mid-typing) while the
 *  targets hold the parsed values; resyncs a field only when its target changed
 *  from outside (another set added, reps switched to time, …). */
function useFieldTexts(
  targets: SetTarget[],
  valueOf: (t: SetTarget) => number | undefined,
  format: (v: number) => string,
  parse: (text: string) => number | null,
) {
  const [texts, setTexts] = useState<string[]>(() =>
    targets.map((t) => {
      const v = valueOf(t);
      return v !== undefined ? format(v) : "";
    }),
  );

  useEffect(() => {
    setTexts((prev) =>
      targets.map((t, i) => {
        const currentText = prev[i] ?? "";
        const currentParsed = parse(currentText);
        const propValue = valueOf(t);
        // Both "no value", or the text already reads as the value: keep the typing.
        if (currentParsed === null && propValue === undefined) return currentText;
        if (currentParsed === propValue) return currentText;
        return propValue !== undefined ? format(propValue) : "";
      }),
    );
    // valueOf/format/parse are module-level functions at the call sites: stable.
  }, [targets]);

  return [texts, setTexts] as const;
}

const weightOf = (t: SetTarget) => t.weightKg;
const secondsOf = (t: SetTarget) => t.seconds;

export function TargetRows({
  targets,
  timed = false,
  onChange,
}: {
  targets: SetTarget[];
  /** Each set is a time (seconds) instead of reps. */
  timed?: boolean;
  onChange: (targets: SetTarget[]) => void;
}) {
  const [weightTexts, setWeightTexts] = useFieldTexts(targets, weightOf, formatWeight, parseWeight);
  const [timeTexts, setTimeTexts] = useFieldTexts(targets, secondsOf, formatDuration, parseDuration);

  function updateReps(index: number, reps: string) {
    const updated = [...targets];
    updated[index] = { ...updated[index], reps };
    onChange(updated);
  }

  function updateTime(index: number, text: string) {
    const texts = [...timeTexts];
    texts[index] = text;
    setTimeTexts(texts);

    const updated = [...targets];
    const parsed = parseDuration(text);
    updated[index] = { ...updated[index], seconds: parsed ?? undefined };
    onChange(updated);
  }

  function updateWeight(index: number, text: string) {
    const updated = [...weightTexts];
    updated[index] = text;
    setWeightTexts(updated);

    const updatedTargets = [...targets];
    const parsed = parseWeight(text);
    updatedTargets[index] = {
      ...updatedTargets[index],
      weightKg: parsed ?? undefined,
    };
    onChange(updatedTargets);
  }

  function addSet() {
    const lastSet = targets[targets.length - 1];
    onChange([...targets, { ...lastSet }]);
  }

  function removeSet(index: number) {
    if (targets.length <= 1) return;
    onChange(targets.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-x-2 gap-y-1.5 items-center">
        {/* Headers */}
        <div className="text-[13px] text-muted">Set</div>
        <div className="text-[13px] text-muted">{timed ? "Time" : "Reps"}</div>
        <div className="text-[13px] text-muted">Weight (kg)</div>
        <div className="w-8" /> {/* Spacer for remove button column */}

        {/* Set rows */}
        {targets.map((target, i) => (
          <Fragment key={i}>
            <div className="text-sm text-muted">{i + 1}</div>
            {timed ? (
              <Input
                placeholder="0:30"
                aria-label={`Set ${i + 1} time (seconds or m:ss)`}
                value={timeTexts[i] ?? ""}
                onChange={(e) => updateTime(i, e.target.value)}
              />
            ) : (
              <Input
                placeholder="10"
                value={target.reps}
                onChange={(e) => updateReps(i, e.target.value)}
              />
            )}
            <Input
              placeholder={timed ? "—" : "25"}
              inputMode="decimal"
              value={weightTexts[i] ?? ""}
              onChange={(e) => updateWeight(i, e.target.value)}
            />
            <Button
              variant="danger"
              size="sm"
              onClick={() => removeSet(i)}
              disabled={targets.length <= 1}
              className="!px-2 !py-1.5"
            >
              ✕
            </Button>
          </Fragment>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={addSet}
        className="mt-2 !px-2 !py-1"
      >
        + Add set
      </Button>
    </div>
  );
}
