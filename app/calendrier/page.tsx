"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type NextEpisode = {
  air_date: string;
  episode_number: number;
  season_number: number;
  name: string;
};

type UpcomingShow = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  nextEpisode: NextEpisode;
};

type UpcomingMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
};

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatMonthLabel(dateStr: string) {
  const date = new Date(dateStr);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDay(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function CalendrierPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [upcomingShows, setUpcomingShows] = useState<UpcomingShow[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<UpcomingMovie[]>([]);
  const [loadingShows, setLoadingShows] = useState(true);
  const [loadingMovies, setLoadingMovies] = useState(true);

  // Partie 1 : séries suivies "en cours" par l'utilisateur
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoadingShows(false);
        return;
      }

      const { data: shows } = await supabase
        .from("user_shows")
        .select("tmdb_id")
        .eq("user_id", user.id)
        .eq("media_type", "tv")
        .eq("status", "en_cours");

      if (!shows || shows.length === 0) {
        setLoadingShows(false);
        return;
      }

      const results = await Promise.all(
        shows.map(async (show) => {
          const res = await fetch(`/api/tv/${show.tmdb_id}`);
          const data = await res.json();

          if (!data.next_episode_to_air) return null;

          return {
            tmdb_id: show.tmdb_id,
            title: data.name,
            poster_path: data.poster_path,
            nextEpisode: data.next_episode_to_air,
          } as UpcomingShow;
        })
      );

      const filtered = results
        .filter((r): r is UpcomingShow => r !== null)
        .sort(
          (a, b) =>
            new Date(a.nextEpisode.air_date).getTime() -
            new Date(b.nextEpisode.air_date).getTime()
        );

      setUpcomingShows(filtered);
      setLoadingShows(false);
    }

    load();
  }, [supabase]);

  // Partie 2 : sorties cinéma à venir, tout public, pas lié à l'utilisateur
  useEffect(() => {
    async function loadMovies() {
      setLoadingMovies(true);
      const res = await fetch("/api/upcoming-movies");
      const data = await res.json();
      setUpcomingMovies(data.movies || []);
      setLoadingMovies(false);
    }
    loadMovies();
  }, []);

  const groupedShows = upcomingShows.reduce<Record<string, UpcomingShow[]>>(
    (acc, show) => {
      const monthLabel = formatMonthLabel(show.nextEpisode.air_date);
      if (!acc[monthLabel]) acc[monthLabel] = [];
      acc[monthLabel].push(show);
      return acc;
    },
    {}
  );

const groupedMovies: Record<string, UpcomingMovie[]> = upcomingMovies.reduce(
  (acc: Record<string, UpcomingMovie[]>, movie) => {
    const monthLabel = formatMonthLabel(movie.release_date);
    if (!acc[monthLabel]) acc[monthLabel] = [];
    acc[monthLabel].push(movie);
    return acc;
  },
  {}
);

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="font-display text-3xl uppercase mb-8">
        Calendrier des sorties
      </h1>

      {/* Partie 1 : mes séries en cours */}
      <section className="mb-12">
        <h2 className="font-display text-xl uppercase mb-4 text-[#111111]">
          Mes séries en cours
        </h2>

        {!user && (
          <p className="text-gray-500">
            <Link href="/login" className="text-[#E1263F] underline">
              Connecte-toi
            </Link>{" "}
            pour voir les prochains épisodes de tes séries suivies.
          </p>
        )}

        {user && loadingShows && <p>Chargement...</p>}

        {user && !loadingShows && upcomingShows.length === 0 && (
          <p className="text-gray-500">
            Aucune sortie prévue pour tes séries en cours.
          </p>
        )}

        {Object.entries(groupedShows).map(([month, shows]) => (
          <div key={month} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">
              {month}
            </h3>
            <div className="flex flex-col gap-3">
              {shows.map((show) => (
                <Link
                  key={show.tmdb_id}
                  href={`/serie/${show.tmdb_id}`}
                  className="manga-panel flex gap-4 bg-white p-3 hover:bg-gray-50 transition items-center"
                >
                  {show.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${show.poster_path}`}
                      alt={show.title}
                      width={50}
                      height={75}
                      className="rounded"
                    />
                  ) : (
                    <div className="w-[50px] h-[75px] bg-gray-200 rounded" />
                  )}
                  <div>
                    <p className="font-medium">{show.title}</p>
                    <p className="text-sm text-gray-600">
                      S{show.nextEpisode.season_number}E
                      {show.nextEpisode.episode_number} ·{" "}
                      {show.nextEpisode.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {formatDay(show.nextEpisode.air_date)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Partie 2 : sorties cinéma générales */}
      <section>
        <h2 className="font-display text-xl uppercase mb-4 text-[#111111]">
          Prochaines sorties cinéma
        </h2>

        {loadingMovies && <p>Chargement...</p>}

        {!loadingMovies && upcomingMovies.length === 0 && (
          <p className="text-gray-500">Aucune sortie trouvée.</p>
        )}

        {Object.entries(groupedMovies).map(([month, movies]) => (
          <div key={month} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">
              {month}
            </h3>
            <div className="flex flex-col gap-3">
              {movies.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/film/${movie.id}`}
                  className="manga-panel flex gap-4 bg-white p-3 hover:bg-gray-50 transition items-center"
                >
                  {movie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                      alt={movie.title}
                      width={50}
                      height={75}
                      className="rounded"
                    />
                  ) : (
                    <div className="w-[50px] h-[75px] bg-gray-200 rounded" />
                  )}
                  <div>
                    <p className="font-medium">{movie.title}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {formatDay(movie.release_date)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}