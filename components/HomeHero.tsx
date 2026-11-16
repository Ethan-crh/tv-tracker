"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useAuth } from "@/components/AuthProvider";
import { ChevronRightIcon } from "@/components/Icons";
import { mediaHref } from "@/components/PosterCard";
import { tmdbImage } from "@/lib/images";
import type { Backdrop } from "@/lib/types";

const SLIDE_MS = 7000;
const EASE = [0.16, 1, 0.3, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const rise = {
  hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1, ease: EASE },
  },
};

export default function HomeHero({ backdrops }: { backdrops: Backdrop[] }) {
  const { user, loading } = useAuth();
  const [index, setIndex] = useState(0);
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Parallaxe : l'image grossit et le texte s'efface en défilant.
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", "end start"],
  });
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // Une minuterie par diapositive : un clic sur un point la relance.
  useEffect(() => {
    if (backdrops.length < 2) return;
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % backdrops.length),
      SLIDE_MS,
    );
    return () => clearTimeout(timer);
  }, [index, backdrops.length]);

  const current = backdrops[index];

  return (
    <section
      ref={section}
      className="relative isolate overflow-hidden bg-night text-white"
    >
      <motion.div
        style={reduced ? undefined : { scale: imageScale }}
        className="absolute inset-0 -z-10"
      >
        <AnimatePresence>
          {current && (
            <motion.div
              key={`${current.media_type}-${current.id}`}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            >
              <Image
                src={tmdbImage(current.backdrop_path, "backdrop")}
                alt=""
                fill
                sizes="100vw"
                preload={index === 0}
                className="animate-kenburns object-cover object-[center_30%]"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/60 to-black/25" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgb(0_0_0/0.55)_100%)]" />

      <motion.div
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
        className="mx-auto flex min-h-[calc(100svh-6.25rem)] max-w-5xl flex-col items-center justify-center px-5 pb-32 pt-20 text-center sm:min-h-[calc(100svh-3.25rem)]"
      >
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p
            variants={rise}
            className="text-[15px] font-semibold text-white/70 sm:text-[17px]"
          >
            Films · Séries · Animes
          </motion.p>

          <motion.h1
            variants={rise}
            className="headline mt-4 text-[44px] sm:text-[72px] lg:text-[88px]"
          >
            Tout ce que tu regardes.
            <br />
            <span className="text-white/50">Au même endroit.</span>
          </motion.h1>

          <motion.p
            variants={rise}
            className="mx-auto mt-6 max-w-xl text-[17px] leading-snug text-white/75 sm:text-[21px]"
          >
            Coche chaque épisode, suis les prochaines sorties et retrouve
            toujours où tu en es.
          </motion.p>

          <motion.div
            variants={rise}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/recherche" className="btn btn-primary btn-lg">
              Explorer les titres
            </Link>
            {!loading &&
              (user ? (
                <Link href="/mes-listes" className="btn btn-glass btn-lg">
                  Mes listes
                </Link>
              ) : (
                <Link href="/signup" className="btn btn-glass btn-lg">
                  Créer un compte
                </Link>
              ))}
          </motion.div>

          <motion.p variants={rise} className="mt-6 min-h-5 text-[14px] text-white/55">
            {!loading && user && <>Connecté · {user.email}</>}
            {!loading && !user && (
              <>
                Déjà inscrit ?{" "}
                <Link
                  href="/login"
                  className="inline-flex items-center text-link-dark hover:underline"
                >
                  Se connecter
                  <ChevronRightIcon size={13} strokeWidth={2.4} />
                </Link>
              </>
            )}
          </motion.p>
        </motion.div>
      </motion.div>

      {current && (
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 pb-7 sm:flex-row sm:justify-between sm:px-6 sm:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${current.media_type}-${current.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="max-w-full"
              >
                <Link
                  href={mediaHref(current)}
                  className="group flex max-w-full items-center gap-1 text-[13px] text-white/75 transition-colors hover:text-white"
                >
                  <span className="text-white/50">À l&apos;affiche</span>
                  <span className="truncate font-medium">{current.title}</span>
                  <ChevronRightIcon
                    size={13}
                    strokeWidth={2.4}
                    className="shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </motion.div>
            </AnimatePresence>

            {backdrops.length > 1 && (
              <div className="flex items-center gap-1.5" aria-label="Images de fond">
                {backdrops.slice(0, 12).map((b, i) => (
                  <button
                    key={`${b.media_type}-${b.id}`}
                    onClick={() => setIndex(i)}
                    aria-label={`Afficher ${b.title}`}
                    aria-current={i === index ? "true" : undefined}
                    className={`relative h-1.5 overflow-hidden rounded-full bg-white/30 transition-[width] duration-500 ease-apple ${
                      i === index ? "w-6" : "w-1.5 hover:bg-white/50"
                    }`}
                  >
                    {i === index && (
                      <motion.span
                        key={index}
                        className="absolute inset-y-0 left-0 rounded-full bg-white"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
