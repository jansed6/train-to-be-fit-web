"use client";

import { useEffect, useMemo } from "react";
import { BodyMapPair } from "./BodyMap";
import { BodyTypeToggle } from "./BodyTypeToggle";
import { useBodyType } from "@/lib/useBodyType";
import { MUSCLES, levelsFor, type ExerciseMuscles } from "@/lib/muscles";

/** Bottom sheet with the muscles an exercise works (main in red, supporting lighter). */
export function MuscleSheet({
  title,
  muscles,
  onClose,
}: {
  title: string;
  muscles: ExerciseMuscles;
  onClose: () => void;
}) {
  const [type, setType] = useBodyType();
  const levels = useMemo(() => levelsFor(muscles), [muscles]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={`${title}: muscles worked`}
        className="w-full max-w-[480px] rounded-t-2xl bg-surface p-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">
              Muscles worked
            </div>
            <strong className="text-lg">{title}</strong>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted">
            ✕
          </button>
        </div>

        <BodyMapPair type={type} levels={levels} size="lg" captions />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {muscles.primary.map((m) => (
            <span key={m} className="rounded-full bg-[var(--muscle)] px-2.5 py-1 text-xs font-semibold text-white">
              {MUSCLES[m].label}
            </span>
          ))}
          {muscles.secondary.map((m) => (
            <span
              key={m}
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--muscle)]"
              style={{ background: "color-mix(in srgb, var(--muscle) 16%, transparent)" }}
            >
              {MUSCLES[m].label}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-muted">Red: main muscles · light red: supporting</span>
          <BodyTypeToggle value={type} onChange={setType} />
        </div>
      </div>
    </div>
  );
}
