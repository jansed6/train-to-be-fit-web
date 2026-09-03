import { cn } from "@/lib/cn";

export type BearMood = "strong" | "happy" | "tired" | "calm" | "cheer";

/** The grizzly mascot for a given mood (transparent PNG in /public/bear). */
export function MoodBear({
  mood,
  size = 96,
  className,
}: {
  mood: BearMood;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/bear/${mood}.png`}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("object-contain", className)}
    />
  );
}
