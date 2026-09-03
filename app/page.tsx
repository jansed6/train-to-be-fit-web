"use client";

import Link from "next/link";
import { Container, PageTitle } from "@/components/ui/layout";
import { StatTile } from "@/components/ui/StatTile";
import { buttonClass } from "@/components/ui/Button";
import { PlanCard } from "@/components/home/PlanCard";
import { StarterPlanCard } from "@/components/StarterPlanCard";
import { starterPlans } from "@/lib/starterPlans";
import { usePlans, useSessions } from "@/lib/hooks";
import { signOut } from "@/lib/auth";
import { totalVolume } from "@/lib/format";

function startOfWeekMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const mondayOffset = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - mondayOffset);
  return d.getTime();
}

export default function HomePage() {
  const plans = usePlans();
  const sessions = useSessions();

  const weekStart = startOfWeekMs();
  const weekSessions = (sessions ?? []).filter((s) => s.date >= weekStart);
  const weekVolume = Math.round(
    weekSessions.reduce((sum, s) => sum + totalVolume(s), 0),
  );

  return (
    <Container>
      <div className="mb-4 flex items-center gap-2">
        <span
          className="rounded-full bg-[rgba(255,122,27,0.12)] px-2.5 py-0.5 text-accent"
          aria-hidden
        >
          🐻
        </span>
        <strong>Train to be fit</strong>
        <button
          type="button"
          onClick={() => signOut()}
          className="ml-auto text-sm text-muted"
        >
          Sign out
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatTile value={weekSessions.length} label="this week" />
        <StatTile value={weekVolume} label="volume (kg)" />
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <PageTitle>Workouts</PageTitle>
        <Link
          href="/plans/new"
          className={buttonClass({ variant: "primary", size: "sm" })}
        >
          + New plan
        </Link>
      </div>

      {plans === undefined ? null : plans.length === 0 ? (
        <div className="py-8">
          <p className="mb-3 text-center text-muted">No plan yet.</p>
          <div className="mx-auto max-w-[420px]">
            <StarterPlanCard plan={starterPlans[0]} />
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/plans/new"
              className={buttonClass({ variant: "neutral" })}
            >
              Or create your own
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </Container>
  );
}
