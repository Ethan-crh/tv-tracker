"use client";

import { motion } from "motion/react";
import CountUp from "@/components/CountUp";
import EmptyState, { SignInPrompt } from "@/components/EmptyState";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import Skeleton from "@/components/Skeleton";
import { STATUS_LABELS, STATUS_ORDER, type Status } from "@/lib/types";
import { useLibrary } from "@/lib/useLibrary";

const STATUS_COLORS: Record<Status, string> = {
  en_cours: "bg-accent",
  a_voir: "bg-sun",
  termine: "bg-ink",
  abandonne: "bg-ink/25",
};

const EASE = [0.16, 1, 0.3, 1] as const;

export default function StatsView() {
  const library = useLibrary();

  if (library.phase === "loading") {
    return (
      <>
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="mb-8 h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </>
    );
  }

  if (library.phase === "signed-out") {
    return <SignInPrompt>Tes statistiques sont calculées à partir de tes listes.</SignInPrompt>;
  }

  if (library.phase === "error") {
    return (
      <EmptyState kana="エラー" title="Chargement impossible">
        Tes statistiques n&apos;ont pas pu être calculées. Recharge la page dans
        un instant.
      </EmptyState>
    );
  }

  const { entries } = library;

  if (entries.length === 0) {
    return (
      <EmptyState
        kana="ゼロ"
        title="Pas encore de chiffres"
        action={{ href: "/recherche", label: "Explorer les titres" }}
      >
        Ajoute des titres à tes listes : tes statistiques apparaîtront ici.
      </EmptyState>
    );
  }

  let episodes = 0;
  let movies = 0;
  let minutes = 0;
  const genreTally = new Map<string, number>();
  const statusTally = new Map<Status, number>();

  for (const entry of entries) {
    statusTally.set(entry.status, (statusTally.get(entry.status) || 0) + 1);
    if (!entry.summary) continue;

    for (const genre of entry.summary.genres) {
      genreTally.set(genre, (genreTally.get(genre) || 0) + 1);
    }

    if (entry.media_type === "tv") {
      episodes += entry.watched;
      minutes += entry.watched * entry.summary.runtime;
    } else if (entry.status === "termine") {
      movies += 1;
      minutes += entry.summary.runtime;
    }
  }

  const hours = Math.round(minutes / 60);
  const days = minutes / 60 / 24;
  const topGenres = Array.from(genreTally.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxGenre = topGenres[0]?.[1] || 1;

  const cards = [
    { label: "Titres suivis", value: entries.length },
    { label: "Épisodes vus", value: episodes },
    { label: "Films vus", value: movies },
    { label: "Heures regardées", value: hours },
  ];

  return (
    <div className="flex flex-col gap-8">
      <Stagger gap={0.08} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <StaggerItem key={card.label}>
            <div className="panel p-4 sm:p-5">
              <p className="font-display text-3xl text-accent sm:text-4xl">
                <CountUp value={card.value} />
              </p>
              <p className="eyebrow mt-1.5">{card.label}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <div className="panel panel-lg relative overflow-hidden bg-ink p-6 text-paper sm:p-8">
          <div className="halftone-light absolute inset-0" />
          <div className="relative">
            <p className="eyebrow !text-paper/60">Temps total devant l&apos;écran</p>
            <p className="mt-2 font-display text-4xl leading-none sm:text-6xl">
              <CountUp value={days} decimals={1} className="text-sun" />{" "}
              <span className="text-2xl sm:text-3xl">
                jour{days >= 2 ? "s" : ""}
              </span>
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-paper/65">
              Soit {hours.toLocaleString("fr-FR")} heure{hours > 1 ? "s" : ""}.
              Estimation : durée réelle des films vus, et durée typique d&apos;un
              épisode pour chaque série.
            </p>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-2">
        <Reveal>
          <section className="panel h-full p-5 sm:p-6">
            <h2 className="mb-5 font-display text-xl">Genres préférés</h2>
            {topGenres.length === 0 ? (
              <p className="text-sm text-muted">Pas encore assez de titres.</p>
            ) : (
              <ol className="flex flex-col gap-3.5">
                {topGenres.map(([name, count], i) => (
                  <li key={name}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-bold">
                        <span className="mr-2 font-mono text-xs text-accent">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {name}
                      </span>
                      <span className="font-mono text-xs text-muted">
                        {count} titre{count > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full border border-ink bg-paper">
                      <motion.div
                        className={`h-full ${i === 0 ? "bg-accent" : "bg-ink"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxGenre) * 100}%` }}
                        transition={{ duration: 0.9, delay: i * 0.08, ease: EASE }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </Reveal>

        <Reveal delay={0.1}>
          <section className="panel h-full p-5 sm:p-6">
            <h2 className="mb-5 font-display text-xl">Répartition</h2>
            <div className="flex h-5 overflow-hidden rounded-full border-2 border-ink">
              {STATUS_ORDER.map((status, i) => {
                const count = statusTally.get(status) || 0;
                if (count === 0) return null;
                return (
                  <motion.div
                    key={status}
                    title={`${STATUS_LABELS[status]} : ${count}`}
                    className={`${STATUS_COLORS[status]} border-r border-ink last:border-r-0`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / entries.length) * 100}%` }}
                    transition={{ duration: 0.9, delay: i * 0.1, ease: EASE }}
                  />
                );
              })}
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {STATUS_ORDER.map((status) => (
                <li key={status} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={`h-3.5 w-3.5 shrink-0 rounded-[3px] border border-ink ${STATUS_COLORS[status]}`}
                  />
                  <span className="flex-1">{STATUS_LABELS[status]}</span>
                  <span className="font-mono text-xs text-muted">
                    {statusTally.get(status) || 0}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
