import { formatDuration, formatWeight } from "@/lib/format";
import { personalRecordIndex, plotValue, type ProgressPoint } from "@/lib/progress";

const PR_GOLD = "#f5b301";

function shortDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function ProgressChart({ points }: { points: ProgressPoint[] }) {
  const W = 320;
  const H = 190;
  const padL = 36;
  const padR = 14;
  const padT = 14;
  const padB = 26;
  const n = points.length;

  // Timed exercises chart the longest hold (seconds), the rest the top weight.
  const timed = points[0]?.seconds !== undefined;
  const label = timed ? formatDuration : formatWeight;
  const weights = points.map(plotValue);
  let minW = Math.min(...weights);
  let maxW = Math.max(...weights);
  if (minW === maxW) {
    const pad = timed ? 5 : 2.5;
    minW = Math.max(0, minW - pad);
    maxW += pad;
  }
  const range = maxW - minW;

  const x = (i: number) =>
    n <= 1 ? padL + (W - padL - padR) / 2 : padL + (W - padL - padR) * (i / (n - 1));
  const y = (v: number) => padT + (H - padT - padB) * (1 - (v - minW) / range);

  const pr = personalRecordIndex(points);
  const line = points.map((p, i) => `${x(i)},${y(plotValue(p))}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={timed ? "Longest hold over time" : "Weight progress over time"}
    >
      {/* baseline grid (min / max) */}
      <line x1={padL} y1={y(maxW)} x2={W - padR} y2={y(maxW)} stroke="var(--border)" />
      <line x1={padL} y1={y(minW)} x2={W - padR} y2={y(minW)} stroke="var(--border)" />

      <text x={padL - 6} y={y(maxW) + 3} textAnchor="end" fontSize="10" fill="var(--text-secondary)">
        {label(maxW)}
      </text>
      <text x={padL - 6} y={y(minW) + 3} textAnchor="end" fontSize="10" fill="var(--text-secondary)">
        {label(minW)}
      </text>

      {n > 1 && (
        <polyline
          points={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {points.map((p, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(plotValue(p))}
          r={i === pr ? 5 : 3.5}
          fill={i === pr ? PR_GOLD : "var(--accent)"}
        />
      ))}

      <text x={padL} y={H - 8} fontSize="10" fill="var(--text-secondary)">
        {shortDate(points[0].date)}
      </text>
      <text x={W - padR} y={H - 8} textAnchor="end" fontSize="10" fill="var(--text-secondary)">
        {shortDate(points[n - 1].date)}
      </text>
    </svg>
  );
}
