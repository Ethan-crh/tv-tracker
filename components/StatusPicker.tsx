"use client";

import { motion } from "motion/react";
import { CheckIcon } from "@/components/Icons";
import { STATUS_LABELS, type Status } from "@/lib/types";

const ORDER: Status[] = ["a_voir", "en_cours", "termine", "abandonne"];

/** Choix du statut de suivi. Recliquer sur le statut actif le retire. */
export default function StatusPicker({
  value,
  onChange,
  disabled = false,
  labels = STATUS_LABELS,
  statuses = ORDER,
}: {
  value: Status | null;
  onChange: (status: Status) => void;
  disabled?: boolean;
  labels?: Record<Status, string>;
  statuses?: Status[];
}) {
  return (
    <div role="group" aria-label="Statut de suivi" className="flex flex-wrap gap-2">
      {statuses.map((status) => {
        const active = value === status;
        return (
          <motion.button
            key={status}
            whileTap={{ scale: 0.94 }}
            onClick={() => onChange(status)}
            disabled={disabled}
            aria-pressed={active}
            className={`btn ${active ? "btn-primary" : ""}`}
          >
            {active && (
              <motion.span
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
              >
                <CheckIcon size={14} />
              </motion.span>
            )}
            {labels[status]}
          </motion.button>
        );
      })}
    </div>
  );
}
