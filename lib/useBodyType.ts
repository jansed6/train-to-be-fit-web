"use client";

import { useEffect, useState } from "react";
import type { BodyType } from "./bodyMapData";

const KEY = "ttbf.bodyType";
const EVENT = "ttbf:bodytype";

/** Which figure the body maps use (per device), kept in sync across components. */
export function useBodyType(): [BodyType, (t: BodyType) => void] {
  const [type, setType] = useState<BodyType>("male");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "male" || saved === "female") setType(saved);
    } catch {
      // storage blocked — keep the default
    }
    const onChange = (e: Event) => setType((e as CustomEvent<BodyType>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  function change(t: BodyType) {
    try {
      localStorage.setItem(KEY, t);
    } catch {
      // storage blocked — the choice lasts for this page only
    }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: t }));
  }

  return [type, change];
}
