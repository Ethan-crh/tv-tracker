"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import EmptyState, { SignInPrompt } from "@/components/EmptyState";
import { AlertIcon, CheckIcon, ListIcon } from "@/components/Icons";
import { Poster, mediaHref } from "@/components/PosterCard";
import ProgressBar from "@/components/ProgressBar";
import SegmentedControl from "@/components/SegmentedControl";
import Skeleton from "@/components/Skeleton";
import { KIND_LABELS, STATUS_LABELS, STATUS_ORDER, type Status } from "@/lib/types";
import { useLibrary, type LibraryEntry } from "@/lib/useLibrary";

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3";
const EASE = [0.16, 1, 0.3, 1] as const;

export default function LibraryView() {
  const library = useLibrary();
  const [picked, setPicked] = useState<Status | null>(null);

  if (library.phase === "loading") {
    return (
      <>
        <Skeleton className="mb-8 h-10 w-full max-w-[460px] !rounded-full" />
        <div className={GRID}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[140px] w-full !rounded-[18px]" />
          ))}
        </div>
      </>
    );
  }

  if (library.phase === "signed-out") {
    return <SignInPrompt>Tes listes t&apos;attendent juste derrière.</SignInPrompt>;
  }

  if (library.phase === "error") {
    return (
      <EmptyState icon={<AlertIcon size={26} />} title="Chargement impossible">
        Tes listes n&apos;ont pas pu être chargées. Recharge la page dans un
        instant.
      </EmptyState>
    );
  }

  const { entries } = library;

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<ListIcon size={26} />}
        title="Ta liste est vide"
        action={{ href: "/recherche", label: "Explorer les titres" }}
      >
        Ajoute ton premier film, ta première série ou ton premier anime pour
        commencer ton suivi.
      </EmptyState>
    );
  }

  const byStatus = new Map<Status, LibraryEntry[]>();
  for (const status of STATUS_ORDER) byStatus.set(status, []);
  for (const entry of entries) byStatus.get(entry.status)?.push(entry);

  // Onglet par défaut : le premier statut non vide.
  const active =
    picked ?? STATUS_ORDER.find((s) => byStatus.get(s)!.length > 0) ?? "en_cours";
  const visible = [...byStatus.get(active)!].sort((a, b) =>
    (a.summary?.title || "").localeCompare(b.summary?.title || "", "fr"),
  );

  return (
    <>
      <div className="mb-8">
        <SegmentedControl
          label="Statut"
          semantics="tab"
          fill
          value={active}
          onChange={setPicked}
          options={STATUS_ORDER.map((status) => ({
            value: status,
            // Sur mobile, le nombre passe sous le libellé pour que les
            // quatre statuts tiennent dans la largeur de l'écran.
            label: (
              <span className="flex flex-col items-center leading-tight sm:flex-row sm:gap-1.5">
                {STATUS_LABELS[status]}
                <span className="text-[12px] tabular-nums opacity-50 sm:text-[13px]">
                  {byStatus.get(status)!.length}
                </span>
              </span>
            ),
          }))}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          role="tabpanel"
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          {visible.length === 0 ? (
            <p className="py-12 text-center text-[15px] text-muted">
              Aucun titre dans « {STATUS_LABELS[active]} » pour l&apos;instant.
            </p>
          ) : (
            <div className={GRID}>
              {visible.map((entry) => (
                <motion.div
                  key={`${entry.media_type}-${entry.tmdb_id}`}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
                  }}
                >
                  <LibraryCard entry={entry} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function LibraryCard({ entry }: { entry: LibraryEntry }) {
  const { summary } = entry;
  const title = summary?.title ?? "Titre indisponible";
  const total = summary?.number_of_episodes ?? 0;
  const percent = total > 0 ? (entry.watched / total) * 100 : 0;
  const remaining = total - entry.watched;

  return (
    <Link
      href={mediaHref({ media_type: entry.media_type, id: entry.tmdb_id })}
      className="card card-interactive group flex h-full gap-4 p-3.5"
    >
      <Poster
        path={summary?.poster_path ?? null}
        alt={title}
        sizes="76px"
        className="w-[76px] shrink-0 self-start !rounded-[10px] shadow-[0_2px_8px_rgb(0_0_0/0.12)]"
      />
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <p className="text-[12px] font-semibold text-muted">
          {summary ? KIND_LABELS[summary.kind] : "—"}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[17px] font-semibold leading-snug tracking-[-0.015em]">
          {title}
        </p>

        {entry.media_type === "tv" && summary && total > 0 && (
          <div className="mt-auto pt-3">
            <ProgressBar percent={percent} label={`Progression de ${title}`} />
            <p className="mt-2 flex justify-between text-[12px] tabular-nums text-muted">
              <span>
                {entry.watched} sur {total} ép.
              </span>
              {remaining <= 0 ? (
                <span className="flex items-center gap-1 font-medium text-success-text">
                  <CheckIcon size={11} />À jour
                </span>
              ) : (
                <span>
                  {remaining} restant{remaining > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
