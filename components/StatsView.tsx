"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import CountUp from "@/components/CountUp";
import EmptyState, { SignInPrompt } from "@/components/EmptyState";
import {
  AlertIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  FilmIcon,
  ListIcon,
} from "@/components/Icons";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import Skeleton from "@/components/Skeleton";
import { STATUS_LABELS, STATUS_ORDER, type Status } from "@/lib/types";
import { useLibrary } from "@/lib/useLibrary";

/** Couleurs système, dans l'ordre de STATUS_ORDER. */
const STATUS_COLORS: Record<Status, string> = {
  en_cours: "#0071e3",
  a_voir: "#ff9f0a",
  termine: "#34c759",
  abandonne: "#aeaeb2",
};

const EASE = [0.16, 1, 0.3, 1] as const;

export default function StatsView() {
  const library = useLibrary();

  if (library.phase === "loading") {
    return (
      <>
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[136px] w-full !rounded-[18px]" />
          ))}
        </div>
        <Skeleton className="mb-5 h-56 w-full !rounded-[28px]" />
        <Skeleton className="h-72 w-full !rounded-[28px]" />
      </>
    );
  }

  if (library.phase === "signed-out") {
    return <SignInPrompt>Tes statistiques sont calculées à partir de tes listes.</SignInPrompt>;
  }

  if (library.phase === "error") {
    return (
      <EmptyState icon={<AlertIcon size={26} />} title="Chargement impossible">
        Tes statistiques n&apos;ont pas pu être calculées. Recharge la page dans
        un instant.
      </EmptyState>
    );
  }

  const { entries } = library;

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<ChartIcon size={26} />}
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

  const cards: { label: string; value: number; icon: ReactNode; tint: string }[] = [
    { label: "Titres suivis", value: entries.length, icon: <ListIcon size={18} />, tint: "bg-[#0071e3]" },
    { label: "Épisodes vus", value: episodes, icon: <CheckIcon size={16} />, tint: "bg-[#34c759]" },
    { label: "Films vus", value: movies, icon: <FilmIcon size={18} />, tint: "bg-[#ff9f0a]" },
    { label: "Heures regardées", value: hours, icon: <ClockIcon size={18} />, tint: "bg-[#a970ff]" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Stagger gap={0.08} className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {cards.map((card) => (
          <StaggerItem key={card.label}>
            <div className="card p-5 sm:p-6">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${card.tint}`}
              >
                {card.icon}
              </span>
              <p className="mt-4 text-[34px] font-semibold leading-none tracking-tight tabular-nums sm:text-[40px]">
                <CountUp value={card.value} />
              </p>
              <p className="mt-1.5 text-[14px] text-muted">{card.label}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <div className="relative overflow-hidden rounded-[28px] bg-night p-7 text-white sm:p-10">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#2997ff] opacity-30 blur-[90px]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-28 right-24 h-64 w-64 rounded-full bg-[#a970ff] opacity-25 blur-[90px]"
          />
          <div className="relative">
            <p className="text-[15px] font-semibold text-white/55">
              Temps total devant l&apos;écran
            </p>
            <p className="headline mt-3 text-[64px] sm:text-[96px]">
              <CountUp value={days} decimals={1} className="text-gradient" />
              <span className="ml-3 text-[28px] font-semibold text-white sm:text-[40px]">
                jour{days >= 2 ? "s" : ""}
              </span>
            </p>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/55">
              Soit {hours.toLocaleString("fr-FR")} heure{hours > 1 ? "s" : ""}.
              Estimation : durée réelle des films vus, et durée typique d&apos;un
              épisode pour chaque série.
            </p>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Reveal>
          <section className="card h-full rounded-[28px] p-6 sm:p-8">
            <h2 className="section-title mb-6 text-[22px]">Genres préférés</h2>
            {topGenres.length === 0 ? (
              <p className="text-[15px] text-muted">Pas encore assez de titres.</p>
            ) : (
              <ol className="flex flex-col gap-4">
                {topGenres.map(([name, count], i) => (
                  <li key={name}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[15px]">
                      <span className="font-medium">{name}</span>
                      <span className="text-[13px] tabular-nums text-muted">
                        {count} titre{count > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
                      <motion.div
                        className={`h-full rounded-full ${i === 0 ? "bg-accent" : "bg-accent/45"}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(count / maxGenre) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 + i * 0.08, ease: EASE }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </Reveal>

        <Reveal delay={0.08}>
          <section className="card h-full rounded-[28px] p-6 sm:p-8">
            <h2 className="section-title mb-6 text-[22px]">Répartition</h2>
            <div className="flex flex-col items-center gap-8 sm:flex-row">
              <StatusDonut tally={statusTally} total={entries.length} />
              <ul className="grid w-full flex-1 grid-cols-1 gap-3">
                {STATUS_ORDER.map((status) => (
                  <li key={status} className="flex items-center gap-3 text-[15px]">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: STATUS_COLORS[status] }}
                    />
                    <span className="flex-1">{STATUS_LABELS[status]}</span>
                    <span className="tabular-nums text-muted">
                      {statusTally.get(status) || 0}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}

/** Anneau segmenté façon app Forme. */
function StatusDonut({ tally, total }: { tally: Map<Status, number>; total: number }) {
  const radius = 62;
  const stroke = 18;
  const circumference = 2 * Math.PI * radius;
  const gap = 3;

  const segments: { status: Status; start: number; length: number }[] = [];
  let offset = 0;
  for (const status of STATUS_ORDER) {
    const count = tally.get(status) || 0;
    if (count === 0) continue;
    const length = (count / total) * circumference;
    segments.push({ status, start: offset, length: Math.max(length - gap, 1) });
    offset += length;
  }

  return (
    <div className="relative h-[164px] w-[164px] shrink-0">
      <svg viewBox="0 0 164 164" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="82" cy="82" r={radius} fill="none" stroke="#0000000a" strokeWidth={stroke} />
        {segments.map((seg, i) => (
          <motion.circle
            key={seg.status}
            cx="82"
            cy="82"
            r={radius}
            fill="none"
            stroke={STATUS_COLORS[seg.status]}
            strokeWidth={stroke}
            strokeDashoffset={-seg.start}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            viewport={{ once: true }}
            whileInView={{
              strokeDasharray: `${seg.length} ${circumference - seg.length}`,
            }}
            transition={{ duration: 1.1, delay: 0.25 + i * 0.12, ease: EASE }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] font-semibold leading-none tracking-tight tabular-nums">
          {total}
        </span>
        <span className="mt-1 text-[13px] text-muted">titre{total > 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}
