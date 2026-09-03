import type { ReactNode } from "react";

export function StatTile({
  value,
  label,
}: {
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-[14px] bg-surface-2 p-3.5">
      <div className="text-[28px] font-bold leading-none tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
