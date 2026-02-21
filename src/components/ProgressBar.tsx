"use client";

import { getProgressPercentage } from "@/lib/utils";

interface ProgressBarProps {
  funded: number;
  total: number;
  variant?: "rose" | "sage";
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  funded,
  total,
  variant = "rose",
  animated = true,
  className = "",
}: ProgressBarProps) {
  const pct = getProgressPercentage(funded, total);
  const isComplete = funded >= total;
  const effectiveVariant = isComplete ? "sage" : variant;

  return (
    <div className={`h-1.5 w-full rounded-full bg-border/60 ${className}`}>
      <div
        className={`h-full rounded-full ${animated ? "progress-bar-animated" : ""} ${
          effectiveVariant === "sage"
            ? "bg-gradient-to-r from-sage to-sage/70"
            : "bg-gradient-to-r from-rose to-deep-rose"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
