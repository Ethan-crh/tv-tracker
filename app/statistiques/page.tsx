"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Status = "a_voir" | "en_cours" | "termine" | "abandonne";

type UserShowRow = {
  tmdb_id: number;
  media_type: "tv" | "movie";
  status: Status;
};

const AVG_EPISODE_MINUTES = 24;
const AVG_MOVIE_MINUTES = 110;

export default function StatistiquesPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [totalShows, setTotalShows] = useState(0);
  const [totalEpisodesWatched, setTotalEpisodesWatched] = useState(0);
  const [moviesWatched, setMoviesWatched] = useState(0);
  const [movieMinutes, setMovieMinutes] = useState(0);
  const [episodeMinutes, setEpisodeMinutes] = useState(0);
  const [topGenres, setTopGenres] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: userShows } = await supabase
        .from("user_shows")
        .select("tmdb_id, media_type, status")
        .eq("user_id", user.id);

      const shows = (userShows || []) as UserShowRow[];
      setTotalShows(shows.length);

      const { count: episodesCount } = await supabase
        .from("watched_episodes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setTotalEpisodesWatched(episodesCount || 0);

      const finishedMovies = shows.filter(
        (s) => s.media_type === "movie" && s.status === "termine"
      );
      setMoviesWatched(finishedMovies.length);

      const genreTally = new Map<string, number>();
      let totalMovieMinutes = 0;
      let totalEpisodeMinutesReal = 0;

      await Promise.all(
        shows.map(async (show) => {
          const endpoint =
            show.media_type === "tv"
              ? `/api/tv/${show.tmdb_id}`
              : `/api/movie/${show.tmdb_id}`;
          const res = await fetch(endpoint);
          const data = await res.json();

          (data.genres || []).forEach((g: { name: string }) => {
            genreTally.set(g.name, (genreTally.get(g.name) || 0) + 1);
          });

          if (show.media_type === "movie" && show.status === "termine") {
            totalMovieMinutes += data.runtime || AVG_MOVIE_MINUTES;
          }

          if (show.media_type === "tv") {
            // TMDB fournit la durée typique des épisodes de CETTE série précise
            const showAvgRuntime =
              (data.episode_run_time && data.episode_run_time[0]) ||
              AVG_EPISODE_MINUTES;

            const { count } = await supabase
              .from("watched_episodes")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("tmdb_id", show.tmdb_id);

            totalEpisodeMinutesReal += (count || 0) * showAvgRuntime;
          }
        })
      );

      setMovieMinutes(totalMovieMinutes);
      setEpisodeMinutes(totalEpisodeMinutesReal);

      const sortedGenres = Array.from(genreTally.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
      setTopGenres(sortedGenres);

      setLoading(false);
    }

    load();
  }, [supabase]);

  if (loading) return <p className="p-8">Chargement...</p>;

  if (!user) {
    return (
      <main className="p-8 text-center">
        <p>Connecte-toi pour voir tes statistiques.</p>
        <Link href="/login" className="text-[#E1263F] underline">
          Se connecter
        </Link>
      </main>
    );
  }

  const totalMinutes = episodeMinutes + movieMinutes;
  const totalHours = Math.round(totalMinutes / 60);
  const totalDays = (totalMinutes / 60 / 24).toFixed(1);

  const statCards = [
    { label: "Titres suivis", value: totalShows },
    { label: "Épisodes vus", value: totalEpisodesWatched },
    { label: "Films vus", value: moviesWatched },
    { label: "Heures regardées", value: totalHours },
  ];

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-8">
      <h1 className="font-display text-3xl uppercase mb-2 text-[#111111]">
        Mes statistiques
      </h1>
      <p className="text-sm text-[#6B6B6B] mb-8">
        Estimation basée sur la durée moyenne réelle des épisodes de chaque
        série (donnée TMDB) et la durée réelle des films.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-10 sm:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="border-4 border-[#111111] bg-[#F7F5F0] p-4 text-center"
          >
            <p className="font-display text-3xl text-[#E1263F]">
              {card.value}
            </p>
            <p className="font-mono-utility text-[10px] uppercase text-[#6B6B6B] mt-1">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      <div className="border-4 border-[#111111] bg-[#F7F5F0] p-4 mb-10">
        <p className="font-mono-utility text-xs uppercase text-[#6B6B6B] mb-1">
          Temps total estimé
        </p>
        <p className="font-display text-2xl text-[#111111]">
          {totalDays} jours ({totalHours} heures)
        </p>
      </div>

      {topGenres.length > 0 && (
        <div>
          <h2 className="font-display text-xl uppercase mb-4 text-[#111111]">
            Genres préférés
          </h2>
          <div className="flex flex-col gap-2">
            {topGenres.map((genre, i) => (
              <div
                key={genre.name}
                className="flex items-center justify-between border-4 border-[#111111] bg-[#F7F5F0] px-4 py-2"
              >
                <span className="font-bold text-[#111111]">
                  {i + 1}. {genre.name}
                </span>
                <span className="font-mono-utility text-xs text-[#6B6B6B]">
                  {genre.count} titre{genre.count > 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}