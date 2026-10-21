"use client";

import { useEffect, useMemo, useState } from "react";
import { BodyMapPair } from "./BodyMap";
import { BodyTypeToggle } from "./BodyTypeToggle";
import { useBodyType } from "@/lib/useBodyType";
import { findCatalogExercise } from "@/lib/exerciseCatalog";
import { MUSCLES, levelsFor } from "@/lib/muscles";

/** Bottom sheet for one exercise: photos, muscles worked and how-to steps. */
export function ExerciseSheet({
  name,
  catalogId,
  onClose,
}: {
  name: string;
  catalogId?: string;
  onClose: () => void;
}) {
  const [type, setType] = useBodyType();
  const entry = findCatalogExercise(catalogId, name);
  const levels = useMemo(() => (entry ? levelsFor(entry) : {}), [entry]);
  const [steps, setSteps] = useState<{ sk: string[]; en: string[] } | null>(null);
  const [lang, setLang] = useState<"sk" | "en">("sk");
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Steps are a sizeable text table, so they load only when a sheet opens.
  useEffect(() => {
    if (!entry) return;
    let live = true;
    import("@/lib/exerciseSteps").then((m) => live && setSteps(m.EXERCISE_STEPS[entry.id] ?? null));
    return () => {
      live = false;
    };
  }, [entry]);

  // Alternate the start and end photos so the movement reads like a flipbook.
  useEffect(() => {
    if (!entry?.image || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setFrame((f) => 1 - f), 1400);
    return () => clearInterval(t);
  }, [entry?.image]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={name}
        className="flex max-h-[90vh] w-full max-w-[520px] flex-col rounded-t-2xl bg-surface sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline p-4">
          <div className="min-w-0">
            <strong className="block text-lg leading-tight">{name}</strong>
            {entry && entry.sk.toLowerCase() !== name.toLowerCase() && (
              <span className="block text-sm text-muted">{entry.sk}</span>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          {entry?.image && (
            <div className="relative aspect-[3/2] flex-none overflow-hidden rounded-xl bg-surface-2">
              {[0, 1].map((i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={`/exercises/${entry.image}/${i}.jpg`}
                  alt={i === 0 ? `${name}: start position` : `${name}: end position`}
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                  style={{ opacity: frame === i ? 1 : 0 }}
                />
              ))}
              <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white">
                {frame === 0 ? "Start" : "Finish"}
              </span>
            </div>
          )}

          {entry ? (
            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Muscles worked
                </span>
                <BodyTypeToggle value={type} onChange={setType} />
              </div>
              <BodyMapPair type={type} levels={levels} size="lg" captions />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {entry.primary.map((m) => (
                  <span key={m} className="rounded-full bg-[var(--muscle)] px-2.5 py-1 text-xs font-semibold text-white">
                    {MUSCLES[m].label}
                  </span>
                ))}
                {entry.secondary.map((m) => (
                  <span
                    key={m}
                    className="rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--muscle)]"
                    style={{ background: "color-mix(in srgb, var(--muscle) 16%, transparent)" }}
                  >
                    {MUSCLES[m].label}
                  </span>
                ))}
              </div>
            </section>
          ) : (
            <p className="text-sm text-muted">No details for this custom exercise yet.</p>
          )}

          {steps && steps[lang].length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">How to</span>
                <div className="inline-flex rounded-full bg-surface-2 p-0.5" role="group" aria-label="Language">
                  {(["sk", "en"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      aria-pressed={lang === l}
                      onClick={() => setLang(l)}
                      className={
                        lang === l
                          ? "rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-content shadow-card"
                          : "rounded-full px-2.5 py-0.5 text-xs font-semibold text-muted"
                      }
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <ol
                lang={lang}
                className="flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed marker:font-bold marker:text-accent"
              >
                {steps[lang].map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </section>
          )}

          {entry?.image && (
            <p className="text-[11px] text-muted">Photos and steps: free-exercise-db (public domain).</p>
          )}
        </div>
      </div>
    </div>
  );
}
