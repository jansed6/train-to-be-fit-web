"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import {
  exerciseCatalog,
  muscleGroups,
  searchCatalog,
  type CatalogExercise,
} from "@/lib/exerciseCatalog";

export interface PickedExercise {
  name: string;
  sets: number;
  reps: string;
  catalogId: string;
}

export function ExercisePicker({
  onAdd,
  onClose,
}: {
  onAdd: (items: PickedExercise[]) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const results = useMemo(() => searchCatalog(query), [query]);
  const sections = useMemo(
    () =>
      muscleGroups
        .map((group) => ({
          group,
          items: results.filter((e) => e.group === group),
        }))
        .filter((s) => s.items.length > 0),
    [results],
  );
  const count = Object.values(selected).filter(Boolean).length;

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function add() {
    const items = exerciseCatalog
      .filter((e) => selected[e.id])
      .map<PickedExercise>((e) => ({
        name: e.name,
        sets: 3,
        reps: "10",
        catalogId: e.id,
      }));
    if (items.length) onAdd(items);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-[640px] flex-col rounded-t-2xl bg-surface sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-hairline p-4">
          <div className="mb-3 flex items-center justify-between">
            <strong className="text-lg">Add exercises</strong>
            <button onClick={onClose} aria-label="Close" className="text-muted">
              ✕
            </button>
          </div>
          <input
            className={inputClass}
            placeholder="Search (e.g. bench, drep, biceps)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {sections.length === 0 ? (
            <p className="py-8 text-center text-muted">No match.</p>
          ) : (
            sections.map((section) => (
              <div key={section.group} className="mb-4">
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  {section.group}
                </div>
                <div className="flex flex-col gap-1.5">
                  {section.items.map((ex) => (
                    <ExerciseOption
                      key={ex.id}
                      exercise={ex}
                      selected={!!selected[ex.id]}
                      onToggle={() => toggle(ex.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-hairline p-4">
          <Button variant="primary" block disabled={count === 0} onClick={add}>
            {count === 0
              ? "Select exercises"
              : `Add ${count} exercise${count > 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExerciseOption({
  exercise,
  selected,
  onToggle,
}: {
  exercise: CatalogExercise;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between gap-2 rounded-[12px] border p-3 text-left",
        selected
          ? "border-accent bg-[rgba(255,122,27,0.08)]"
          : "border-hairline bg-surface-2",
      )}
    >
      <span>
        <span className="block font-medium">{exercise.name}</span>
        <span className="block text-xs text-muted">
          {exercise.muscles.join(", ")}
        </span>
      </span>
      <span
        className={cn(
          "flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 text-sm",
          selected
            ? "border-accent bg-accent text-white"
            : "border-hairline text-transparent",
        )}
      >
        ✓
      </span>
    </button>
  );
}
