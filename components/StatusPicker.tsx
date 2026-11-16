"use client";

import SegmentedControl from "@/components/SegmentedControl";
import { STATUS_LABELS, type Status } from "@/lib/types";

const ORDER: Status[] = ["a_voir", "en_cours", "termine", "abandonne"];

/** Choix du statut de suivi. Retoucher le statut actif le retire. */
export default function StatusPicker({
  value,
  onChange,
  disabled = false,
  labels = STATUS_LABELS,
  statuses = ORDER,
  tone = "dark",
}: {
  value: Status | null;
  onChange: (status: Status) => void;
  disabled?: boolean;
  labels?: Record<Status, string>;
  statuses?: Status[];
  tone?: "light" | "dark";
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className={`text-[13px] font-medium ${tone === "dark" ? "text-white/60" : "text-muted"}`}>
        {value
          ? "Dans ta liste · touche à nouveau pour retirer"
          : "Ajouter à ma liste"}
      </p>
      <div className="scrollbar-hide -mx-1 overflow-x-auto px-1">
        <SegmentedControl
          label="Statut de suivi"
          tone={tone}
          value={value}
          onChange={onChange}
          disabled={disabled}
          options={statuses.map((s) => ({ value: s, label: labels[s] }))}
        />
      </div>
    </div>
  );
}
