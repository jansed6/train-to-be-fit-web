"use client";

import { useRouter } from "next/navigation";
import { starterPlans } from "@/lib/starterPlans";
import { StarterPlanCard } from "./StarterPlanCard";

export function StarterPlansSection() {
  const router = useRouter();

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">
        Starter plans
      </div>
      {starterPlans.map((plan) => (
        <StarterPlanCard
          key={plan.id}
          plan={plan}
          onAdded={() => router.push("/")}
        />
      ))}
    </div>
  );
}
