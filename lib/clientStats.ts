import type { WorkoutSession } from "./types";
import { compareSession } from "./compare";

export interface WeekDay {
  label: string;
  trained: boolean;
  offPlan: boolean;
}

/**
 * Returns the Monday 00:00 of the current local week.
 */
export function startOfWeekMs(now: Date): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const mondayOffset = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - mondayOffset);
  return d.getTime();
}

/**
 * Counts sessions that occurred at or after the given moment.
 */
export function countSince(sessions: WorkoutSession[], sinceMs: number): number {
  return sessions.filter((s) => s.date >= sinceMs).length;
}

/**
 * Returns Mon..Sun of the current local week, marking trained days and
 * off-plan days (sessions with skipped + below > 0).
 */
export function weekStrip(sessions: WorkoutSession[], now: Date): WeekDay[] {
  const weekStart = startOfWeekMs(now);
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dayStart = weekStart + i * 86400000; // milliseconds in a day
    const dayEnd = dayStart + 86400000;

    const daySessions = sessions.filter((s) => s.date >= dayStart && s.date < dayEnd);
    const trained = daySessions.length > 0;
    const offPlan = daySessions.some((s) => {
      const comparison = compareSession(s);
      return comparison.skipped + comparison.below > 0;
    });

    days.push({
      label: dayLabels[i],
      trained,
      offPlan,
    });
  }

  return days;
}
