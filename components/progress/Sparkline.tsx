import type { ProgressPoint } from "@/lib/progress";

/** Tiny inline trend line for the history list. */
export function Sparkline({ points }: { points: ProgressPoint[] }) {
  const W = 96;
  const H = 32;
  const pad = 3;
  const n = points.length;
  if (n === 0) return null;

  const weights = points.map((p) => p.weight);
  let minW = Math.min(...weights);
  let maxW = Math.max(...weights);
  if (minW === maxW) {
    minW -= 1;
    maxW += 1;
  }

  const x = (i: number) => (n <= 1 ? W / 2 : pad + (W - 2 * pad) * (i / (n - 1)));
  const y = (v: number) => pad + (H - 2 * pad) * (1 - (v - minW) / (maxW - minW));
  const line = points.map((p, i) => `${x(i)},${y(p.weight)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden className="flex-none">
      {n > 1 && (
        <polyline
          points={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <circle cx={x(n - 1)} cy={y(points[n - 1].weight)} r="2.5" fill="var(--accent)" />
    </svg>
  );
}
