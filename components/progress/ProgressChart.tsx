import { formatWeight } from "@/lib/format";
import { personalRecordIndex, type ProgressPoint } from "@/lib/progress";

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

  const weights = points.map((p) => p.weight);
  let minW = Math.min(...weights);
  let maxW = Math.max(...weights);
  if (minW === maxW) {
    minW -= 2.5;
    maxW += 2.5;
  }
  const range = maxW - minW;

  const x = (i: number) =>
    n <= 1 ? padL + (W - padL - padR) / 2 : padL + (W - padL - padR) * (i / (n - 1));
  const y = (v: number) => padT + (H - padT - padB) * (1 - (v - minW) / range);

  const pr = personalRecordIndex(points);
  const line = points.map((p, i) => `${x(i)},${y(p.weight)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Weight progress over time"
    >
      {/* baseline grid (min / max) */}
      <line x1={padL} y1={y(maxW)} x2={W - padR} y2={y(maxW)} stroke="var(--border)" />
      <line x1={padL} y1={y(minW)} x2={W - padR} y2={y(minW)} stroke="var(--border)" />

      <text x={padL - 6} y={y(maxW) + 3} textAnchor="end" fontSize="10" fill="var(--text-secondary)">
        {formatWeight(maxW)}
      </text>
      <text x={padL - 6} y={y(minW) + 3} textAnchor="end" fontSize="10" fill="var(--text-secondary)">
        {formatWeight(minW)}
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
          cy={y(p.weight)}
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
