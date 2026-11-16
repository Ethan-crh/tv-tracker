import FeatureBento from "@/components/FeatureBento";
import HomeHero from "@/components/HomeHero";
import PosterRail from "@/components/PosterRail";
import { Reveal } from "@/components/Reveal";
import ScrollHighlight from "@/components/ScrollHighlight";
import { getBackdrops, getTopItems } from "@/lib/tmdb";

// Page statique, régénérée au plus une fois par heure.
export const revalidate = 3600;

const STATEMENT =
  "Fini de chercher où tu t'étais arrêté. Chaque épisode coché, chaque sortie à venir, chaque heure passée devant l'écran : tout est là, au même endroit.";

export default async function Home() {
  const [backdrops, films, animes] = await Promise.all([
    getBackdrops().catch(() => []),
    getTopItems("films", 20).catch(() => []),
    getTopItems("animes", 20).catch(() => []),
  ]);

  return (
    <main>
      <HomeHero backdrops={backdrops} />

      <section className="mx-auto max-w-5xl px-5 py-28 sm:px-6 sm:py-40">
        <ScrollHighlight
          text={STATEMENT}
          className="text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] sm:text-[48px] lg:text-[56px]"
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-10 text-center sm:mb-14">
          <p className="eyebrow mb-3">Fonctionnalités</p>
          <h2 className="headline text-[36px] sm:text-[56px]">
            Pensé pour ceux
            <br />
            qui regardent tout.
          </h2>
        </Reveal>
        <FeatureBento />
      </section>

      {(films.length > 0 || animes.length > 0) && (
        <section className="mx-auto mt-24 flex max-w-6xl flex-col gap-10 overflow-hidden px-4 sm:mt-32 sm:px-6">
          <Reveal>
            <PosterRail eyebrow="Tendances" title="Top films" items={films} ranked />
          </Reveal>
          <Reveal>
            <PosterRail eyebrow="Tendances" title="Top animes" items={animes} ranked />
          </Reveal>
        </section>
      )}
    </main>
  );
}
