import type { Metadata } from "next";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import PosterRail from "@/components/PosterRail";
import SearchExperience from "@/components/SearchExperience";
import { PosterGridSkeleton } from "@/components/Skeleton";
import { getTopItems } from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Explorer",
  description: "Recherche un film, une série ou un anime, ou explore par genre.",
};

export const revalidate = 3600;

export default async function RecherchePage() {
  const [films, animes, series] = await Promise.all([
    getTopItems("films").catch(() => []),
    getTopItems("animes").catch(() => []),
    getTopItems("series").catch(() => []),
  ]);

  return (
    <main className="mx-auto max-w-6xl overflow-hidden px-4 py-12 sm:px-6 sm:py-20">
      <PageHeader eyebrow="Explorer" title="Qu'est-ce qu'on regarde ?">
        Cherche un titre précis — les abréviations comme « jjk » ou « snk »
        fonctionnent — ou explore par genre.
      </PageHeader>

      {/* useSearchParams impose une frontière Suspense sur une page statique */}
      <Suspense fallback={<PosterGridSkeleton />}>
        <SearchExperience>
          <div className="flex flex-col gap-10">
            <PosterRail eyebrow="En ce moment" title="Top films" items={films} ranked eager />
            <PosterRail eyebrow="En ce moment" title="Top animes" items={animes} ranked />
            <PosterRail eyebrow="En ce moment" title="Top séries" items={series} ranked />
          </div>
        </SearchExperience>
      </Suspense>
    </main>
  );
}
