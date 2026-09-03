import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "neutral" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold cursor-pointer transition disabled:opacity-50 disabled:cursor-default";

const SIZES: Record<ButtonSize, string> = {
  md: "px-5 py-3 text-base",
  sm: "px-3.5 py-2 text-sm",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "text-white bg-[linear-gradient(135deg,var(--accent-light),var(--accent))]",
  neutral: "bg-surface-2 text-content",
  ghost: "bg-transparent text-accent",
  danger: "bg-transparent text-red-500",
};

/** Class string for a button-styled element (use on <Link> too). */
export function buttonClass(opts: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
} = {}): string {
  const { variant = "neutral", size = "md", block = false } = opts;
  return cn(BASE, SIZES[size], VARIANTS[variant], block && "flex w-full");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

export function Button({
  variant,
  size,
  block,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonClass({ variant, size, block }), className)}
      {...props}
    />
  );
}
