import { PageTitle } from "@/components/ui/layout";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { ProgressChart } from "@/components/progress/ProgressChart";
import { personalRecordIndex, type ExerciseSummary } from "@/lib/progress";
import { formatWeight } from "@/lib/format";

export function ProgressDetail({ summary }: { summary: ExerciseSummary }) {
  const points = summary.points;
  const pr = points[personalRecordIndex(points)];
  const latest = points[points.length - 1];

  return (
    <>
      <PageTitle>{summary.name}</PageTitle>
      <Card className="mb-4">
        <ProgressChart points={points} />
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <StatTile value={`${formatWeight(pr.weight)} kg`} label={`PR · ${pr.reps} reps`} />
        <StatTile value={`${formatWeight(pr.est1RM)} kg`} label="est. 1RM" />
        <StatTile value={`${formatWeight(latest.weight)} kg`} label="latest" />
        <StatTile value={points.length} label="sessions" />
      </div>
    </>
  );
}
