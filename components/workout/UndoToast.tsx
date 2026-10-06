"use client";

import { useEffect } from "react";

const SHOW_MS = 5000;

/** Bottom snackbar with an Undo action; dismisses itself after a few seconds. */
export function UndoToast({
  message,
  onUndo,
  onClose,
}: {
  message: string;
  onUndo: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, SHOW_MS);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
      <div className="flex w-full max-w-[608px] items-center gap-3 rounded-[14px] bg-content px-4 py-3 text-bg shadow-xl">
        <span className="min-w-0 flex-1 truncate text-sm">{message}</span>
        <button
          type="button"
          onClick={onUndo}
          className="flex-none text-sm font-bold text-accent"
        >
          Undo
        </button>
      </div>
    </div>
  );
}
