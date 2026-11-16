"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/components/AuthProvider";
import { ArrowRightIcon } from "@/components/Icons";
import { mediaHref } from "@/components/PosterCard";
import { tmdbImage } from "@/lib/images";
import type { Backdrop } from "@/lib/types";

const SLIDE_MS = 7000;
const EASE = [0.16, 1, 0.3, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const slam = {
  hidden: { opacity: 0, y: 40, scale: 0.9, rotate: -6 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
} as const;

const rise = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export default function HomeHero({ backdrops }: { backdrops: Backdrop[] }) {
  const { user, loading } = useAuth();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (backdrops.length < 2) return;
    const timer = setInterval(() => {
      // On met le carrousel en pause quand l'onglet n'est pas visible.
      if (document.visibilityState === "visible") {
        setIndex((i) => (i + 1) % backdrops.length);
      }
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [backdrops.length]);

  const current = backdrops[index];

  return (
    <section className="relative isolate overflow-hidden border-b-2 border-ink">
      {/* Fond : affiches du moment en fondu enchaîné + lent zoom */}
      <div className="absolute inset-0 -z-10 bg-paper-deep">
        <AnimatePresence>
          {current && (
            <motion.div
              key={current.backdrop_path}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            >
              <Image
                src={tmdbImage(current.backdrop_path, "w1280")}
                alt=""
                fill
                sizes="100vw"
                preload={index === 0}
                className="animate-kenburns object-cover object-[center_25%]"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-paper/80 via-paper/60 to-paper" />
        <div className="halftone absolute inset-0 opacity-60" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex min-h-[calc(100dvh-8rem)] max-w-3xl flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:min-h-[calc(100dvh-4rem)] sm:gap-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-[0.09] sm:h-[760px] sm:w-[760px]"
        >
          <div className="speed-burst h-full w-full animate-spin-slow" />
        </div>

        <motion.span
          variants={slam}
          className="panel inline-block -rotate-2 bg-sun px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-widest"
        >
          Films · Séries · Animes
        </motion.span>

        <motion.h1
          variants={slam}
          className="panel panel-lg -rotate-1 bg-paper px-6 py-5 font-display text-4xl leading-none tracking-tight sm:px-12 sm:py-7 sm:text-7xl"
        >
          My TV-Board
        </motion.h1>

        <motion.p
          variants={rise}
          className="max-w-md text-base leading-relaxed text-ink-soft sm:text-lg"
        >
          Coche chaque épisode, suis les prochaines sorties et retrouve
          toujours où tu en es.
        </motion.p>

        <motion.div
          variants={rise}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/recherche" className="btn btn-lg btn-primary">
            Explorer les titres
            <ArrowRightIcon size={16} />
          </Link>
          {!loading &&
            (user ? (
              <Link href="/mes-listes" className="btn btn-lg">
                Mes listes
              </Link>
            ) : (
              <Link href="/signup" className="btn btn-lg">
                Créer un compte
              </Link>
            ))}
        </motion.div>

        <motion.p
          variants={rise}
          className="min-h-5 font-mono text-xs text-muted"
        >
          {!loading && user && (
            <>
              Connecté · <span className="text-ink">{user.email}</span>
            </>
          )}
          {!loading && !user && (
            <>
              Déjà inscrit ?{" "}
              <Link href="/login" className="link text-ink">
                Se connecter
              </Link>
            </>
          )}
        </motion.p>
      </motion.div>

      {/* Titre de l'image de fond en cours */}
      {current && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-center sm:bottom-6 sm:left-6 sm:right-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.backdrop_path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <Link
                href={mediaHref(current)}
                className="group flex max-w-full items-center gap-2 rounded-full border-2 border-ink bg-paper/90 py-1 pl-1 pr-3 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-sun"
              >
                <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper">
                  À l&apos;affiche
                </span>
                <span className="truncate">{current.title}</span>
                <ArrowRightIcon
                  size={12}
                  className="shrink-0 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
