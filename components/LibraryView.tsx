"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import EmptyState, { SignInPrompt } from "@/components/EmptyState";
import { Poster, mediaHref } from "@/components/PosterCard";
import ProgressBar from "@/components/ProgressBar";
import Skeleton from "@/components/Skeleton";
import { KIND_LABELS, STATUS_LABELS, STATUS_ORDER, type Status } from "@/lib/types";
import { useLibrary, type LibraryEntry } from "@/lib/useLibrary";

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

export default function LibraryView() {
  const library = useLibrary();
  const [picked, setPicked] = useState<Status | null>(null);

  if (library.phase === "loading") {
    return (
      <>
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-28 !rounded-full" />
          ))}
        </div>
        <div className={GRID}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[136px] w-full" />
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
      <EmptyState kana="エラー" title="Chargement impossible">
        Tes listes n&apos;ont pas pu être chargées. Recharge la page dans un
        instant.
      </EmptyState>
    );
  }

  const { entries } = library;

  if (entries.length === 0) {
    return (
      <EmptyState
        kana="はじめ"
        title="Rien à l'horizon"
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
      <div
        role="tablist"
        aria-label="Statut"
        className="scrollbar-hide -mx-4 mb-7 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0"
      >
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            role="tab"
            aria-selected={active === status}
            onClick={() => setPicked(status)}
            className="chip shrink-0"
          >
            {STATUS_LABELS[status]}
            <span
              className={`rounded-full px-1.5 py-px font-mono text-[10px] ${
                active === status ? "bg-white/20" : "bg-ink/10"
              }`}
            >
              {byStatus.get(status)!.length}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          role="tabpanel"
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              Aucun titre dans « {STATUS_LABELS[active]} » pour l&apos;instant.
            </p>
          ) : (
            <div className={GRID}>
              {visible.map((entry) => (
                <motion.div
                  key={`${entry.media_type}-${entry.tmdb_id}`}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                    },
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
      className="panel group flex h-full gap-4 p-3 transition-[transform,box-shadow] duration-300 ease-out-expo hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg"
    >
      <Poster
        path={summary?.poster_path ?? null}
        alt={title}
        sizes="76px"
        className="w-[76px] shrink-0 self-start"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="eyebrow">{summary ? KIND_LABELS[summary.kind] : "—"}</p>
        <p className="mt-0.5 line-clamp-2 font-bold leading-snug transition-colors group-hover:text-accent">
          {title}
        </p>

        {entry.media_type === "tv" && summary && total > 0 && (
          <div className="mt-auto pt-3">
            <ProgressBar percent={percent} label={`Progression de ${title}`} />
            <p className="mt-1.5 flex justify-between font-mono text-[11px] text-muted">
              <span>
                {entry.watched} / {total} ép.
              </span>
              <span>
                {remaining <= 0
                  ? "À jour"
                  : `${remaining} restant${remaining > 1 ? "s" : ""}`}
              </span>
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
