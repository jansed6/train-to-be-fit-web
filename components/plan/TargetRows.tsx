import { useState, useEffect, Fragment } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { parseWeight } from "@/lib/workoutRows";
import { formatWeight } from "@/lib/format";
import type { SetTarget } from "@/lib/types";

export function TargetRows({
  targets,
  onChange,
}: {
  targets: SetTarget[];
  onChange: (targets: SetTarget[]) => void;
}) {
  // Local state for weight inputs to preserve typing state like "27." or "27,"
  const [weightTexts, setWeightTexts] = useState<string[]>([]);

  // Initialize weight texts from targets when targets change externally
  useEffect(() => {
    setWeightTexts(targets.map((t) => (t.weightKg !== undefined ? formatWeight(t.weightKg) : "")));
  }, [targets]);

  function updateReps(index: number, reps: string) {
    const updated = [...targets];
    updated[index] = { ...updated[index], reps };
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
        <div className="text-[13px] text-muted">Reps</div>
        <div className="text-[13px] text-muted">Weight (kg)</div>
        <div className="w-8" /> {/* Spacer for remove button column */}

        {/* Set rows */}
        {targets.map((target, i) => (
          <Fragment key={i}>
            <div className="text-sm text-muted">{i + 1}</div>
            <Input
              placeholder="10"
              value={target.reps}
              onChange={(e) => updateReps(i, e.target.value)}
            />
            <Input
              placeholder="25"
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
