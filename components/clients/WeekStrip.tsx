import type { WeekDay } from "@/lib/clientStats";
import { Card } from "@/components/ui/Card";

export function WeekStrip({ days }: { days: WeekDay[] }) {
  return (
    <Card>
      <div className="flex justify-between">
        {days.map((day, i) => (
          <div key={i} className="text-center text-xs text-muted">
            <div>{day.label}</div>
            <div
              className={`mt-1 h-[26px] w-[26px] rounded-full ${
                day.trained
                  ? day.offPlan
                    ? "bg-accent-light"
                    : "bg-accent"
                  : "bg-surface-2"
              }`}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
