import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import Marquee from "@/components/Marquee";
import PosterRail from "@/components/PosterRail";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
} from "@/components/Icons";
import { getBackdrops, getTopItems } from "@/lib/tmdb";

// Page statique, régénérée au plus une fois par heure.
export const revalidate = 3600;

const FEATURES = [
  {
    href: "/mes-listes",
    Icon: CheckIcon,
    kana: "01",
    title: "Coche, épisode par épisode",
    text: "Marque ce que tu as vu, saison par saison, et reprends exactement là où tu t'étais arrêté.",
    accent: "bg-accent text-white",
  },
  {
    href: "/calendrier",
    Icon: CalendarIcon,
    kana: "02",
    title: "Ne rate plus une sortie",
    text: "Le prochain épisode de tes séries en cours et les films qui arrivent au cinéma, au même endroit.",
    accent: "bg-sun",
  },
  {
    href: "/statistiques",
    Icon: ChartIcon,
    kana: "03",
    title: "Tes chiffres, sans tricher",
    text: "Heures regardées, épisodes vus, genres préférés : le bilan honnête de ton temps d'écran.",
    accent: "bg-ink text-white",
  },
];

export default async function Home() {
  const [backdrops, films, animes] = await Promise.all([
    getBackdrops().catch(() => []),
    getTopItems("films", 20).catch(() => []),
    getTopItems("animes", 20).catch(() => []),
  ]);

  return (
    <main>
      <HomeHero backdrops={backdrops} />
      <Marquee
        words={["Films", "Séries", "Animes", "つづく", "Calendrier", "Statistiques"]}
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <p className="eyebrow mb-2">Comment ça marche</p>
          <h2 className="max-w-xl font-display text-2xl leading-tight sm:text-4xl">
            Tout ton suivi, en trois cases.
          </h2>
        </Reveal>

        <Stagger gap={0.12} className="mt-10 grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ href, Icon, kana, title, text, accent }) => (
            <StaggerItem key={href}>
              <Link
                href={href}
                className="panel group relative flex h-full flex-col overflow-hidden p-6 transition-[transform,box-shadow] duration-300 ease-out-expo hover:-translate-x-1 hover:-translate-y-1 hover:shadow-hard-lg"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-2 -top-6 font-display text-[7rem] leading-none text-ink/[0.06] transition-transform duration-500 ease-out-expo group-hover:-rotate-6 group-hover:scale-110"
                >
                  {kana}
                </span>
                <span
                  className={`mb-5 flex h-11 w-11 items-center justify-center rounded-[4px] border-2 border-ink ${accent}`}
                >
                  <Icon size={20} />
                </span>
                <h3 className="font-display text-lg leading-snug">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                  {text}
                </p>
                <span className="mt-5 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-accent">
                  Ouvrir
                  <ArrowRightIcon
                    size={14}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {(films.length > 0 || animes.length > 0) && (
        <section className="mx-auto flex max-w-6xl flex-col gap-12 overflow-hidden px-4 sm:px-6">
          <Reveal>
            <PosterRail
              eyebrow="En ce moment"
              title="Top films"
              items={films}
              ranked
            />
          </Reveal>
          <Reveal>
            <PosterRail
              eyebrow="En ce moment"
              title="Top animes"
              items={animes}
              ranked
            />
          </Reveal>
        </section>
      )}
    </main>
  );
}
