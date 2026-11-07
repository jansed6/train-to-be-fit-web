"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { useLastClientSession } from "@/lib/hooks";
import { clientLabel, type Coaching } from "@/lib/coaching";
import { daysAgoLabel } from "@/lib/clientStats";

/** A client in the trainer's list: who, and when they last trained what (or
 *  that they haven't signed in yet). */
export function ClientCard({
  client,
  clientId,
  awaitingSignIn,
}: {
  client: Coaching;
  clientId: string;
  awaitingSignIn: boolean;
}) {
  const last = useLastClientSession(clientId);
  const label = clientLabel(client);

  return (
    <Link href={`/clients/${clientId}`} className="block">
      <Card className="flex items-center gap-3 transition hover:border-accent">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[rgba(255,122,27,0.14)] font-bold uppercase text-accent">
          {label.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{label}</div>
          <div className="truncate text-sm text-muted">
            {last === undefined
              ? " "
              : last === null
                ? awaitingSignIn
                  ? "Invite sent · hasn’t signed in yet"
                  : "No workouts yet"
                : `${last.planDayName} · ${daysAgoLabel(last.date, new Date())}`}
          </div>
        </div>
        <span className="text-xl text-muted" aria-hidden>
          ›
        </span>
      </Card>
    </Link>
  );
}
