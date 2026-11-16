import Image from "next/image";
import type { ReactNode } from "react";
import { StarIcon } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { formatRating } from "@/lib/format";
import { tmdbImage } from "@/lib/images";

/** En-tête des fiches film / série : image plein cadre façon Apple TV. */
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
    <section className="relative isolate overflow-hidden bg-night text-white">
      {backdropPath && (
        // Conteneur dédié : il rogne l'image agrandie par le zoom lent.
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <Image
            src={tmdbImage(backdropPath, "backdrop")}
            alt=""
            fill
            sizes="100vw"
            preload
            className="animate-kenburns object-cover object-top opacity-70"
          />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/75 to-black/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/35 to-transparent" />

      <div className="mx-auto flex min-h-[min(82svh,780px)] max-w-6xl flex-col justify-end gap-6 px-5 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-40 md:flex-row md:items-end md:gap-10 md:pt-48">
        <Reveal className="w-28 shrink-0 sm:w-36 md:w-52 lg:w-60">
          <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white/10 shadow-[0_24px_60px_rgb(0_0_0/0.55)] ring-1 ring-white/10 md:rounded-2xl">
            {posterPath && (
              <Image
                src={tmdbImage(posterPath, "poster")}
                alt={`Affiche de ${title}`}
                fill
                sizes="(min-width: 1024px) 240px, (min-width: 768px) 208px, 144px"
                preload
                className="object-cover"
              />
            )}
          </div>
        </Reveal>

        <div className="min-w-0 flex-1">
          <Reveal>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-white/70 sm:text-[14px]">
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[12px] font-semibold text-white backdrop-blur">
                {kindLabel}
              </span>
              {facts.map((fact) => (
                <span key={fact} className="flex items-center gap-2">
                  <span aria-hidden="true">·</span>
                  {fact}
                </span>
              ))}
              {rating > 0 && (
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 text-white">
                    <StarIcon size={12} className="text-star" />
                    {formatRating(rating)}
                  </span>
                </span>
              )}
            </p>

            <h1 className="headline mt-3 text-[40px] sm:text-[60px] lg:text-[72px]">
              {title}
            </h1>
            {tagline && (
              <p className="mt-2 text-[17px] text-white/70 sm:text-[21px]">{tagline}</p>
            )}
            {genres.length > 0 && (
              <p className="mt-3 text-[14px] text-white/55">{genres.join(" · ")}</p>
            )}
          </Reveal>

          <Reveal delay={0.08}>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/80 sm:text-[17px]">
              {overview || "Aucun synopsis disponible en français pour le moment."}
            </p>
          </Reveal>

          {children && (
            <Reveal delay={0.16}>
              <div className="mt-8 flex flex-col gap-6">{children}</div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
