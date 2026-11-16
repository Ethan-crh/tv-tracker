import type { Metadata } from "next";
import CalendarView from "@/components/CalendarView";
import PageHeader from "@/components/PageHeader";
import { getUpcomingMovies } from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Calendrier",
  description: "Les prochains épisodes de tes séries et les sorties cinéma à venir.",
};

export const revalidate = 3600;

export default async function CalendrierPage() {
  const movies = await getUpcomingMovies().catch(() => []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <PageHeader eyebrow="À venir" title="Calendrier des sorties">
        Le prochain épisode de chacune de tes séries en cours, et les films
        qui arrivent en salle.
      </PageHeader>
      <CalendarView movies={movies} />
    </main>
  );
}
