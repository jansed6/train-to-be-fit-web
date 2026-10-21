import { memo } from "react";
import { cn } from "@/lib/cn";
import { BODY_MAP, type BodyType, type BodyView } from "@/lib/bodyMapData";
import { slugLevels, type MuscleLevels } from "@/lib/muscles";

const PLAIN: Record<string, string> = {
  head: "var(--map-skin)",
  neck: "var(--map-skin)",
  hands: "var(--map-skin)",
  knees: "var(--map-skin)",
  ankles: "var(--map-skin)",
  feet: "var(--map-skin)",
  hair: "var(--map-hair)",
};

/** Grey for idle muscles, deepening to full red for the main ones. */
function fillFor(slug: string, level: number | undefined): string {
  if (!level) return PLAIN[slug] ?? "var(--map-body)";
  if (level >= 1) return "var(--muscle)";
  return `color-mix(in srgb, var(--muscle) ${Math.round(20 + 60 * level)}%, var(--map-body))`;
}

/** One view (front or back) of the muscle map. */
export const BodyMap = memo(function BodyMap({
  type,
  view,
  levels,
  className,
}: {
  type: BodyType;
  view: BodyView;
  levels: MuscleLevels;
  className?: string;
}) {
  const figure = BODY_MAP[type];
  const bySlug = slugLevels(levels, view);

  return (
    <svg
      viewBox={figure.viewBox[view]}
      className={cn("block", className)}
      style={{ aspectRatio: "1 / 2" }}
      aria-hidden
    >
      <path d={figure[view].outline} fill="var(--map-gap)" />
      {figure[view].parts.map((part) => {
        const fill = fillFor(part.slug, bySlug[part.slug]);
        return [...part.left, ...part.right, ...part.common].map((d, i) => (
          <path key={`${part.slug}-${i}`} d={d} fill={fill} />
        ));
      })}
    </svg>
  );
});

/** Front and back side by side. */
export function BodyMapPair({
  type,
  levels,
  size,
  captions = false,
}: {
  type: BodyType;
  levels: MuscleLevels;
  size: "sm" | "lg";
  captions?: boolean;
}) {
  const svgClass = size === "sm" ? "h-12" : "h-auto w-full max-w-[150px]";
  return (
    <div className={cn("grid grid-cols-2", size === "sm" ? "gap-0.5" : "gap-2")}>
      {(["front", "back"] as const).map((view) => (
        <figure
          key={view}
          className={cn(
            "m-0 flex flex-col items-center",
            size === "lg" && "gap-1 rounded-xl bg-surface-2 px-1 pb-1.5 pt-2",
          )}
        >
          <BodyMap type={type} view={view} levels={levels} className={svgClass} />
          {captions && (
            <figcaption className="text-[11px] font-semibold text-muted">
              {view === "front" ? "Front" : "Back"}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
