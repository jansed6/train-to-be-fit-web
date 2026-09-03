"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatDuration } from "@/lib/format";

/** Sticky bottom rest countdown, shown after a set is confirmed. */
export function RestBar({
  endsAt,
  onAdd30,
  onSkip,
  onDone,
}: {
  endsAt: number;
  onAdd30: () => void;
  onSkip: () => void;
  onDone: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, Math.round((endsAt - now) / 1000));

  useEffect(() => {
    if (endsAt - now <= 0) {
      try {
        navigator.vibrate?.(200);
      } catch {
        // vibration not supported — ignore
      }
      onDone();
    }
  }, [endsAt, now, onDone]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface">
      <div className="mx-auto flex max-w-[640px] items-center gap-3 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <span className="text-sm text-muted">Rest</span>
        <span className="text-2xl font-bold tabular-nums">
          {formatDuration(remaining)}
        </span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={onAdd30}>
            +30 s
          </Button>
          <Button variant="primary" size="sm" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
