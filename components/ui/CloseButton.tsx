import { cn } from "@/lib/cn";

/** Round ✕ for sheets and dialogs, sized for a thumb (44 × 44 px). */
export function CloseButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className={cn(
        "-mr-1.5 flex h-11 w-11 flex-none items-center justify-center rounded-full bg-surface-2 text-lg font-semibold text-content active:scale-95",
        className,
      )}
    >
      ✕
    </button>
  );
}
