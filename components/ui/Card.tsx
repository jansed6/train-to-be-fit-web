import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("rounded-card border border-hairline bg-surface p-4", className)}
    >
      {children}
    </div>
  );
}

export function SubCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-[14px] bg-surface-2 p-3.5", className)}>
      {children}
    </div>
  );
}
