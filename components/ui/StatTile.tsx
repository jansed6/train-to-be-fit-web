import type { ReactNode } from "react";

export function StatTile({
  value,
  label,
}: {
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-2 p-4">
      <div className="text-[34px] font-extrabold leading-none tracking-tight tabular-nums text-accent">
        {value}
      </div>
      <div className="mt-1.5 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  );
}
