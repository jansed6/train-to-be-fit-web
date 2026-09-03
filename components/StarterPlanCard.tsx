"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  addStarterPlan,
  starterExerciseCount,
  type StarterPlan,
} from "@/lib/starterPlans";

export function StarterPlanCard({
  plan,
  onAdded,
}: {
  plan: StarterPlan;
  onAdded?: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    await addStarterPlan(plan);
    onAdded?.();
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-bold">{plan.name}</div>
          <div className="text-[13px] text-muted">
            {plan.days.length} days · {starterExerciseCount(plan)} exercises
          </div>
          <div className="mt-0.5 text-xs text-muted">{plan.subtitle}</div>
        </div>
        <Button variant="primary" size="sm" disabled={busy} onClick={add}>
          Add
        </Button>
      </div>
    </Card>
  );
}
