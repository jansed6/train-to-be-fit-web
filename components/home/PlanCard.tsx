"use client";

import Link from "next/link";
import { Card, SubCard } from "@/components/ui/Card";
import { Button, buttonClass } from "@/components/ui/Button";
import { deletePlan } from "@/lib/repo";
import type { Plan } from "@/lib/types";

export function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Card>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="font-bold">{plan.name}</span>
        <div className="flex items-center gap-1">
          <Link
            href={`/plans/${plan.id}`}
            className={buttonClass({ variant: "ghost", size: "sm" })}
          >
            Edit
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm(`Delete "${plan.name}"?`)) deletePlan(plan.id);
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {plan.days.map((day) => (
          <SubCard key={day.id}>
            <div className="text-[17px] font-bold">{day.name}</div>
            <div className="mb-2.5 mt-0.5 text-[13px] text-muted">
              {day.exercises.length === 0
                ? "No exercises"
                : `${day.exercises.length} exercises · ${day.exercises
                    .map((e) => e.name)
                    .join(", ")}`}
            </div>
            <Link
              href={`/workout/${plan.id}/${day.id}`}
              className={buttonClass({ variant: "primary", block: true })}
            >
              ▶ Start workout
            </Link>
          </SubCard>
        ))}
      </div>
    </Card>
  );
}
