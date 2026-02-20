"use client";

import { getProgressPercentage } from "@/lib/utils";

interface ProgressBarProps {
  funded: number;
  total: number;
  variant?: "coral" | "green";
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  funded,
  total,
  variant = "coral",
  animated = true,
  className = "",
}: ProgressBarProps) {
  const pct = getProgressPercentage(funded, total);
  const isComplete = funded >= total;
  const effectiveVariant = isComplete ? "green" : variant;

  return (
    <div className={`h-2 w-full rounded-full bg-border ${className}`}>
      <div
        className={`h-full rounded-full ${animated ? "progress-bar-animated" : ""} ${
          effectiveVariant === "green"
            ? "bg-gradient-to-r from-success to-emerald-400"
            : "bg-gradient-to-r from-coral to-deep-coral"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
