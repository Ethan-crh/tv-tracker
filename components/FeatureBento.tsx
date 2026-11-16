"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import CountUp from "@/components/CountUp";
import { CheckIcon, ChevronRightIcon } from "@/components/Icons";

const EASE = [0.16, 1, 0.3, 1] as const;
const VIEW = { once: true, margin: "-80px" } as const;

/** Grille de présentation façon « bento » avec des maquettes animées. */
export default function FeatureBento() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Tile href="/mes-listes" className="sm:col-span-2">
        <TileText
          eyebrow="Suivi"
          title="Coche, épisode par épisode."
          text="Marque ce que tu as vu, saison par saison, et reprends exactement là où tu t'étais arrêté."
        />
        <div className="mt-8 flex flex-1 flex-col">
          <EpisodesMock />
        </div>
      </Tile>

      <Tile href="/calendrier" dark>
        <TileText
          dark
          eyebrow="Calendrier"
          title="Ne rate plus une sortie."
          text="Le prochain épisode de tes séries et les films qui arrivent en salle."
        />
        <CalendarMock />
      </Tile>

      <Tile
        href="/statistiques"
        className="lg:col-span-3"
        innerClassName="lg:flex-row lg:items-center lg:justify-between lg:gap-12"
      >
        <TileText
          eyebrow="Statistiques"
          title="Tes chiffres, d'un coup d'œil."
          text="Heures regardées, épisodes vus, genres préférés."
        />
        <RingMock />
      </Tile>
    </div>
  );
}

function Tile({
  href,
  dark = false,
  className = "",
  innerClassName = "",
  children,
}: {
  href: string;
  dark?: boolean;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEW}
      transition={{ duration: 0.8, ease: EASE }}
      className={className}
    >
      <Link
        href={href}
        className={`group flex h-full flex-col overflow-hidden rounded-[28px] p-7 transition-[transform,box-shadow] duration-500 ease-apple hover:-translate-y-1 hover:shadow-lift sm:p-9 ${
          dark ? "bg-night text-white" : "bg-card shadow-card"
        } ${innerClassName}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}

function TileText({
  eyebrow,
  title,
  text,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  text: string;
  dark?: boolean;
}) {
  return (
    <div>
      <p className={`text-[14px] font-semibold ${dark ? "text-white/55" : "text-muted"}`}>
        {eyebrow}
      </p>
      <h3 className="section-title mt-1.5 text-[24px] sm:text-[28px]">{title}</h3>
      <p
        className={`mt-2 max-w-md text-[15px] leading-relaxed sm:text-[17px] ${
          dark ? "text-white/65" : "text-muted"
        }`}
      >
        {text}
      </p>
      <span
        className={`mt-4 inline-flex items-center text-[15px] font-medium group-hover:underline ${
          dark ? "text-link-dark" : "text-link"
        }`}
      >
        Ouvrir
        <ChevronRightIcon size={14} strokeWidth={2.4} />
      </span>
    </div>
  );
}

// --- Maquettes ---------------------------------------------------------------

const MOCK_EPISODES = [
  "Le vent se lève",
  "La forge",
  "Premier sang",
  "Ceux qui restent",
];

function EpisodesMock() {
  return (
    <div className="mt-auto rounded-2xl bg-paper p-2 pt-2 sm:p-3" aria-hidden="true">
      <div className="mb-2 flex items-center justify-between px-2 pt-1 text-[13px]">
        <span className="font-semibold">Saison 1</span>
        <span className="text-muted">3 sur 4 vus</span>
      </div>
      <ul className="overflow-hidden rounded-xl bg-card">
        {MOCK_EPISODES.map((name, i) => (
          <li
            key={name}
            className="flex items-center gap-3 border-b border-hairline px-3 py-3 last:border-b-0 sm:px-4"
          >
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line">
              {i < 3 && (
                <motion.span
                  className="absolute inset-[-1.5px] flex items-center justify-center rounded-full bg-accent text-white"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={VIEW}
                  transition={{
                    delay: 0.5 + i * 0.35,
                    type: "spring",
                    stiffness: 500,
                    damping: 18,
                  }}
                >
                  <CheckIcon size={13} />
                </motion.span>
              )}
            </span>
            <span className="text-[14px] tabular-nums text-muted">{i + 1}.</span>
            <span className="truncate text-[15px] font-medium">{name}</span>
            <span className="ml-auto hidden text-[13px] text-muted sm:block">24 min</span>
          </li>
        ))}
      </ul>
      <div className="mx-2 mb-1 mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.08]">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: "0%" }}
          whileInView={{ width: "75%" }}
          viewport={VIEW}
          transition={{ delay: 0.5, duration: 1.4, ease: EASE }}
        />
      </div>
    </div>
  );
}

function CalendarMock() {
  return (
    <div className="mt-auto flex items-center gap-4 pt-8" aria-hidden="true">
      <motion.div
        initial={{ rotate: -12, scale: 0.8, opacity: 0 }}
        whileInView={{ rotate: -4, scale: 1, opacity: 1 }}
        viewport={VIEW}
        transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.3 }}
        className="flex h-[88px] w-[88px] shrink-0 flex-col items-center rounded-[22px] bg-white pt-2.5 text-ink shadow-[0_10px_30px_rgb(0_0_0/0.4)]"
      >
        <span className="text-[11px] font-semibold uppercase text-[#ff3b30]">ven.</span>
        <span className="text-[44px] font-light leading-[1.05] tracking-tight">22</span>
      </motion.div>
      <motion.div
        initial={{ x: 24, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={VIEW}
        transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
        className="min-w-0 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur"
      >
        <p className="text-[12px] font-semibold text-link-dark">Demain</p>
        <p className="truncate text-[15px] font-semibold">Tokyo Afterglow</p>
        <p className="truncate text-[13px] text-white/60">S3 E5 · La lame et le serment</p>
      </motion.div>
    </div>
  );
}

function RingMock() {
  const gradientId = useId();
  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="mt-auto flex shrink-0 items-center gap-6 pt-8 lg:mt-0 lg:pt-0" aria-hidden="true">
      <svg viewBox="0 0 110 110" className="h-[104px] w-[104px] shrink-0 -rotate-90 lg:h-[132px] lg:w-[132px]">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2997ff" />
            <stop offset="100%" stopColor="#a970ff" />
          </linearGradient>
        </defs>
        <circle cx="55" cy="55" r={radius} fill="none" stroke="#0000000f" strokeWidth="14" />
        <motion.circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * 0.28 }}
          viewport={VIEW}
          transition={{ duration: 1.6, ease: EASE, delay: 0.3 }}
        />
      </svg>
      <div>
        <p className="text-[40px] font-semibold leading-none tracking-tight tabular-nums lg:text-[56px]">
          <CountUp value={128} />
        </p>
        <p className="mt-1 text-[14px] text-muted">heures regardées</p>
      </div>
    </div>
  );
}
