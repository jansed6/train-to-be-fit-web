"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkoutTimer } from "@/components/workout/WorkoutTimer";
import { useWorkoutDraft } from "@/lib/useWorkoutDraft";

/** A way back to the workout in progress from any page (Home has its own card
 *  with Discard; the workout page is the workout itself). */
export function ActiveWorkoutBar() {
  const path = usePathname() ?? "/";
  const draft = useWorkoutDraft();

  if (!draft || path === "/" || path.startsWith("/workout/")) return null;

  return (
    <Link
      href={`/workout/${draft.planId}/${draft.dayId}`}
      className="sticky top-0 z-20 block border-b border-hairline bg-surface"
    >
      <div className="mx-auto flex max-w-[640px] items-center gap-2 px-4 py-2.5 text-sm md:max-w-[720px]">
        <span className="min-w-0 truncate font-semibold text-accent">
          ▶ <span className="hidden md:inline">Workout in progress · </span>
          {draft.planDayName}
        </span>
        <span className="flex-none">
          <WorkoutTimer startedAt={draft.startedAt} />
        </span>
        <span className="ml-auto flex-none font-semibold text-accent">Continue ›</span>
      </div>
    </Link>
  );
}
