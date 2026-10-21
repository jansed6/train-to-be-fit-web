import { cn } from "@/lib/cn";
import type { BodyType } from "@/lib/bodyMapData";

export function BodyTypeToggle({
  value,
  onChange,
}: {
  value: BodyType;
  onChange: (t: BodyType) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-surface-2 p-0.5" role="group" aria-label="Body">
      {(["male", "female"] as const).map((t) => (
        <button
          key={t}
          type="button"
          aria-pressed={value === t}
          onClick={() => onChange(t)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            value === t ? "bg-surface text-content shadow-card" : "text-muted",
          )}
        >
          {t === "male" ? "Male" : "Female"}
        </button>
      ))}
    </div>
  );
}
