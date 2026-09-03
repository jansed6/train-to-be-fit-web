"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/format";

/** Self-ticking elapsed timer derived from a start timestamp. */
export function WorkoutTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = Math.floor((now - startedAt) / 1000);
  return (
    <span className="tabular-nums text-muted">⏱ {formatDuration(elapsed)}</span>
  );
}
