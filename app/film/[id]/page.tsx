import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import CastRow from "@/components/CastRow";
import MediaHero from "@/components/MediaHero";
import MovieActions from "@/components/MovieActions";
import PosterRail from "@/components/PosterRail";
import { Reveal } from "@/components/Reveal";
import TrailerModal from "@/components/TrailerModal";
import { formatRuntime } from "@/lib/dates";
import { getMovie, parseId, TmdbError } from "@/lib/tmdb";

type Props = { params: Promise<{ id: string }> };

// Mis en cache une heure, partagé entre generateMetadata et la page.
export const revalidate = 3600;

const loadMovie = cache(async (rawId: string) => {
  const id = parseId(rawId);
  if (id === null) notFound();
  try {
    return await getMovie(id);
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await loadMovie((await params).id);
  return {
    title: movie.title,
    description: movie.overview.slice(0, 160) || undefined,
  };
}

export default async function FilmPage({ params }: Props) {
  const movie = await loadMovie((await params).id);

  const facts = [
    movie.release_date?.slice(0, 4),
    movie.runtime ? formatRuntime(movie.runtime) : null,
  ].filter((f): f is string => Boolean(f));

  return (
    <main>
      <MediaHero
        title={movie.title}
        tagline={movie.tagline}
        overview={movie.overview}
        posterPath={movie.poster_path}
        backdropPath={movie.backdrop_path}
        kindLabel="Film"
        facts={facts}
        genres={movie.genres.map((g) => g.name)}
        rating={movie.vote_average}
      >
        <MovieActions movieId={movie.id} />
        <div>
          <TrailerModal trailer={movie.trailer} />
        </div>
      </MediaHero>

      <div className="mx-auto flex max-w-6xl flex-col gap-12 overflow-hidden px-4 py-10 sm:px-6 sm:py-14">
        <Reveal>
          <CastRow cast={movie.cast} />
        </Reveal>
        <Reveal>
          <PosterRail title="Films similaires" items={movie.similar} />
        </Reveal>
      </div>
    </main>
  );
}
