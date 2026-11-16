import Image from "next/image";
import type { ReactNode } from "react";
import { StarIcon } from "@/components/Icons";
import { tmdbImage } from "@/lib/images";

/** En-tête des fiches film / série : fond cinéma, affiche, infos, actions. */
export default function MediaHero({
  title,
  tagline,
  overview,
  posterPath,
  backdropPath,
  kindLabel,
  facts,
  genres,
  rating,
  children,
}: {
  title: string;
  tagline?: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  kindLabel: string;
  /** Infos courtes affichées sur une ligne : année, durée… */
  facts: string[];
  genres: string[];
  rating: number;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b-2 border-ink bg-ink text-paper">
      {backdropPath && (
        <Image
          src={tmdbImage(backdropPath, "w1280")}
          alt=""
          fill
          sizes="100vw"
          preload
          className="-z-20 animate-kenburns object-cover object-top opacity-45"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
      <div className="halftone-light absolute inset-0 -z-10" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:gap-10 sm:px-6 sm:py-14">
        <div className="mx-auto w-40 shrink-0 sm:mx-0 sm:w-56">
          <div className="relative aspect-[2/3] -rotate-2 overflow-hidden rounded-[4px] border-2 border-paper bg-ink-soft shadow-[7px_7px_0_var(--color-accent)]">
            {posterPath ? (
              <Image
                src={tmdbImage(posterPath, "w500")}
                alt={`Affiche de ${title}`}
                fill
                sizes="(min-width: 640px) 224px, 160px"
                preload
                className="object-cover"
              />
            ) : (
              <div className="halftone-light flex h-full items-center justify-center p-4 text-center font-display">
                {title}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-widest">
            <span className="rounded-[3px] bg-sun px-2 py-0.5 font-medium text-ink">
              {kindLabel}
            </span>
            {facts.map((fact) => (
              <span key={fact} className="text-paper/70">
                · {fact}
              </span>
            ))}
            {rating > 0 && (
              <span className="flex items-center gap-1 text-sun">
                · <StarIcon size={12} /> {rating.toFixed(1)}
              </span>
            )}
          </div>

          <h1 className="mt-3 font-display text-3xl leading-tight sm:text-5xl">
            {title}
          </h1>
          {tagline && (
            <p className="mt-2 text-base italic text-paper/70">{tagline}</p>
          )}

          {genres.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {genres.map((genre) => (
                <li
                  key={genre}
                  className="rounded-full border border-paper/40 px-2.5 py-0.5 text-xs text-paper/85"
                >
                  {genre}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-paper/85 sm:text-base">
            {overview || "Aucun synopsis disponible en français pour le moment."}
          </p>

          {children && (
            <div className="mt-6 flex flex-col gap-4">{children}</div>
          )}
        </div>
      </div>
    </section>
  );
}
