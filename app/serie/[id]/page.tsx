import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import CastRow from "@/components/CastRow";
import MediaHero from "@/components/MediaHero";
import PosterRail from "@/components/PosterRail";
import { Reveal } from "@/components/Reveal";
import {
  SeasonTracker,
  SeriesProvider,
  SeriesStatus,
} from "@/components/SeriesTracker";
import TrailerModal from "@/components/TrailerModal";
import { getShow, parseId, TmdbError } from "@/lib/tmdb";
import { KIND_LABELS } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export const revalidate = 3600;

const loadShow = cache(async (rawId: string) => {
  const id = parseId(rawId);
  if (id === null) notFound();
  try {
    return await getShow(id);
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const show = await loadShow((await params).id);
  return {
    title: show.name,
    description: show.overview.slice(0, 160) || undefined,
  };
}

export default async function SeriePage({ params }: Props) {
  const show = await loadShow((await params).id);

  const regularSeasons = show.seasons.filter((s) => s.season_number > 0).length;
  const facts = [
    show.first_air_date?.slice(0, 4),
    regularSeasons > 0
      ? `${regularSeasons} saison${regularSeasons > 1 ? "s" : ""}`
      : null,
    show.status_label,
  ].filter((f): f is string => Boolean(f));

  return (
    <main>
      <SeriesProvider showId={show.id} seasons={show.seasons}>
        <MediaHero
          title={show.name}
          tagline={show.tagline}
          overview={show.overview}
          posterPath={show.poster_path}
          backdropPath={show.backdrop_path}
          kindLabel={KIND_LABELS[show.kind]}
          facts={facts}
          genres={show.genres.map((g) => g.name)}
          rating={show.vote_average}
        >
          <SeriesStatus />
          <div>
            <TrailerModal trailer={show.trailer} />
          </div>
        </MediaHero>

        <div className="mx-auto flex max-w-6xl flex-col gap-14 overflow-hidden px-4 py-12 sm:px-6 sm:py-16">
          <SeasonTracker />
          <Reveal>
            <CastRow cast={show.cast} />
          </Reveal>
          <Reveal>
            <PosterRail
              title={show.kind === "anime" ? "Animes similaires" : "Séries similaires"}
              items={show.similar}
            />
          </Reveal>
        </div>
      </SeriesProvider>
    </main>
  );
}
