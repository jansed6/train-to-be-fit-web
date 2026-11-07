"use client";

import { useEffect, useState } from "react";
import { useMyUserId } from "./auth";
import { DRAFT_CHANGED, readDraft, type WorkoutDraft } from "./workoutDraft";

/** The signed-in user's workout in progress in this browser, kept up to date
 *  as it's written or cleared (here or in another tab). */
export function useWorkoutDraft(): WorkoutDraft | null {
  const me = useMyUserId();
  const [draft, setDraft] = useState<WorkoutDraft | null>(null);

  // Storage is read after mount: it doesn't exist during the server render.
  useEffect(() => {
    const read = () => {
      const d = readDraft();
      setDraft(d && d.userId === me ? d : null);
    };
    read();
    window.addEventListener(DRAFT_CHANGED, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(DRAFT_CHANGED, read);
      window.removeEventListener("storage", read);
    };
  }, [me]);

  return draft;
}
