"use client";

import { motion } from "motion/react";

export default function ProgressBar({
  percent,
  label,
  className = "",
}: {
  percent: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-2 overflow-hidden rounded-full border border-ink bg-card ${className}`}
    >
      <motion.div
        className={`h-full origin-left ${clamped >= 100 ? "bg-sun" : "bg-accent"}`}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
