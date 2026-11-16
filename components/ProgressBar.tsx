"use client";

import { motion } from "motion/react";

export default function ProgressBar({
  percent,
  label,
  tone = "light",
  className = "",
}: {
  percent: number;
  label?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const complete = clamped >= 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-1.5 overflow-hidden rounded-full ${
        tone === "dark" ? "bg-white/20" : "bg-black/[0.08]"
      } ${className}`}
    >
      <motion.div
        className={`h-full rounded-full ${
          complete ? "bg-success" : tone === "dark" ? "bg-white" : "bg-accent"
        }`}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
