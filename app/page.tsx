"use client";

import Link from "next/link";
import { Container, PageTitle } from "@/components/ui/layout";
import { StatTile } from "@/components/ui/StatTile";
import { buttonClass } from "@/components/ui/Button";
import { PlanCard } from "@/components/home/PlanCard";
import { StarterPlanCard } from "@/components/StarterPlanCard";
import { MoodBear } from "@/components/MoodBear";
import { starterPlans } from "@/lib/starterPlans";
import { usePlans, useSessions } from "@/lib/hooks";
import { signOut } from "@/lib/auth";
import { totalVolume } from "@/lib/format";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Good morning — let's move.";
  if (h < 18) return "Time to train.";
  return "Evening session?";
}

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
      <div className="mb-5 flex items-center gap-3">
        <MoodBear mood="strong" size={42} />
        <div className="flex-1">
          <div className="text-lg font-extrabold leading-tight">
            Train to be fit
          </div>
          <div className="text-xs text-muted">{greeting()}</div>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="text-sm text-muted hover:text-content md:hidden"
        >
          Sign out
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatTile value={weekSessions.length} label="this week" />
        <StatTile value={weekVolume} label="volume kg" />
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
          <div className="mb-3 flex justify-center">
            <MoodBear mood="cheer" size={140} />
          </div>
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
