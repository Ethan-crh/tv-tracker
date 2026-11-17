"use client";

import { useId, type ReactNode } from "react";
import { motion } from "motion/react";

export type SegmentOption<T extends string> = {
  value: T;
  label: ReactNode;
};

/**
 * Contrôle segmenté façon iOS : la pastille blanche glisse vers l'option
 * choisie. `value` peut être null (aucune option sélectionnée).
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  tone = "light",
  semantics = "radio",
  disabled = false,
  fill = false,
  className = "",
}: {
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  tone?: "light" | "dark";
  semantics?: "radio" | "tab";
  disabled?: boolean;
  /** Sur mobile, occupe toute la largeur avec des segments égaux. */
  fill?: boolean;
  className?: string;
}) {
  const layoutId = useId();
  const dark = tone === "dark";

  return (
    <div
      role={semantics === "tab" ? "tablist" : "radiogroup"}
      aria-label={label}
      className={`${fill ? "flex w-full sm:inline-flex sm:w-auto" : "inline-flex"} rounded-full p-[3px] ${
        dark ? "bg-white/[0.14] backdrop-blur-xl" : "bg-black/[0.06]"
      } ${disabled ? "opacity-50" : ""} ${className}`}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role={semantics === "tab" ? "tab" : "radio"}
            aria-checked={semantics === "radio" ? active : undefined}
            aria-selected={semantics === "tab" ? active : undefined}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`relative z-0 flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full py-1.5 text-[13px] font-medium ${
              fill ? "px-1.5 sm:px-3.5" : "px-3.5"
            } transition-colors duration-200 disabled:cursor-not-allowed ${
              active
                ? "text-ink"
                : dark
                  ? "text-white/80 hover:text-white"
                  : "text-ink/60 hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-0 -z-10 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.12),0_3px_8px_rgb(0_0_0/0.08)]"
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
