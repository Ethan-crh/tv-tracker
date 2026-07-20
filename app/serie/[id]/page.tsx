"use client";

import { useState, useEffect, use, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Season = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
};

type ShowDetails = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  seasons: Season[];
};

type Episode = {
  id: number;
  episode_number: number;
  season_number?: number;
  name: string;
  overview: string;
  air_date: string;
  still_path: string | null;
};

type Status = "a_voir" | "en_cours" | "termine" | "abandonne";

const STATUS_LABELS: Record<Status, string> = {
  a_voir: "À voir",
  en_cours: "En cours",
  termine: "Terminé",
  abandonne: "Abandonné",
};

export default function SerieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tmdbId = parseInt(id, 10);
  const supabase = createClient();

  const [show, setShow] = useState<ShowDetails | null>(null);
  const [activeSeason, setActiveSeason] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingShow, setLoadingShow] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set());

  // Récupérer l'utilisateur connecté
  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    fetchUser();
  }, [supabase]);

  // Charger les infos de la série
  useEffect(() => {
    async function fetchShow() {
      setLoadingShow(true);
      const res = await fetch(`/api/tv/${id}`);
      const data = await res.json();
      setShow(data);
      setLoadingShow(false);

      const firstRealSeason = data.seasons?.find(
        (s: Season) => s.season_number > 0
      );
      setActiveSeason(
        firstRealSeason ? firstRealSeason.season_number : data.seasons?.[0]?.season_number
      );
    }
    fetchShow();
  }, [id]);

  // Charger le statut existant + les épisodes vus une fois l'user connu
  useEffect(() => {
    if (!user) return;

    async function fetchUserData() {
      const { data: showData } = await supabase
        .from("user_shows")
        .select("status")
        .eq("user_id", user!.id)
        .eq("tmdb_id", tmdbId)
        .eq("media_type", "tv")
        .maybeSingle();

      if (showData) setStatus(showData.status as Status);

      const { data: watchedData } = await supabase
        .from("watched_episodes")
        .select("season_number, episode_number")
        .eq("user_id", user!.id)
        .eq("tmdb_id", tmdbId);

      if (watchedData) {
        const set = new Set(
          watchedData.map((w) => `${w.season_number}-${w.episode_number}`)
        );
        setWatchedSet(set);
      }
    }
    fetchUserData();
  }, [user, tmdbId, supabase]);

  // Charger les épisodes de la saison active
  useEffect(() => {
    if (activeSeason === null) return;

    async function fetchEpisodes() {
      setLoadingEpisodes(true);
      const res = await fetch(`/api/tv/${id}/season/${activeSeason}`);
      const data = await res.json();
      setEpisodes(data.episodes || []);
      setLoadingEpisodes(false);
    }
    fetchEpisodes();
  }, [id, activeSeason]);

  // Changer le statut (ajoute à la liste ou met à jour)
  async function handleStatusChange(newStatus: Status) {
    if (!user) return;

    setStatus(newStatus);

    await supabase.from("user_shows").upsert(
      {
        user_id: user.id,
        tmdb_id: tmdbId,
        media_type: "tv",
        status: newStatus,
      },
      { onConflict: "user_id,tmdb_id,media_type" }
    );
  }

  // Cocher/décocher un épisode
  const toggleEpisode = useCallback(
    async (seasonNumber: number, episodeNumber: number) => {
      if (!user) return;

      const key = `${seasonNumber}-${episodeNumber}`;
      const isWatched = watchedSet.has(key);

      // Mise à jour optimiste de l'UI
      const newSet = new Set(watchedSet);
      if (isWatched) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      setWatchedSet(newSet);

      if (isWatched) {
        await supabase
          .from("watched_episodes")
          .delete()
          .eq("user_id", user.id)
          .eq("tmdb_id", tmdbId)
          .eq("season_number", seasonNumber)
          .eq("episode_number", episodeNumber);
      } else {
        await supabase.from("watched_episodes").insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          season_number: seasonNumber,
          episode_number: episodeNumber,
        });
      }
    },
    [user, tmdbId, watchedSet, supabase]
  );

  if (loadingShow) return <p className="p-8">Chargement...</p>;
  if (!show) return <p className="p-8">Série introuvable.</p>;

  return (
    <main className="max-w-5xl mx-auto p-8">
      <div className="flex gap-6 mb-6">
        {show.poster_path && (
          <Image
            src={`https://image.tmdb.org/t/p/w342${show.poster_path}`}
            alt={show.name}
            width={200}
            height={300}
            className="rounded-lg"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold mb-2">{show.name}</h1>
          <p className="text-gray-600 mb-4">{show.overview}</p>

          {user ? (
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    status === s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Connecte-toi pour suivre cette série.
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {show.seasons
          .filter((s) => s.episode_count > 0)
          .map((season) => (
            <button
              key={season.id}
              onClick={() => setActiveSeason(season.season_number)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition ${
                activeSeason === season.season_number
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {season.name}
            </button>
          ))}
      </div>

      {loadingEpisodes ? (
        <p>Chargement des épisodes...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {episodes.map((ep) => {
            const key = `${ep.season_number ?? activeSeason}-${ep.episode_number}`;
            const isWatched = watchedSet.has(key);

            return (
              <div
                key={ep.id}
                className={`flex gap-4 border rounded-lg p-3 items-start transition ${
                  isWatched ? "bg-green-50 border-green-200" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isWatched}
                  onChange={() =>
                    toggleEpisode(activeSeason!, ep.episode_number)
                  }
                  disabled={!user}
                  className="mt-1 w-5 h-5 cursor-pointer disabled:cursor-not-allowed"
                />
                <div>
                  <p className="font-medium">
                    E{ep.episode_number} · {ep.name}
                  </p>
                  <p className="text-xs text-gray-500 mb-1">{ep.air_date}</p>
                  <p className="text-sm text-gray-600">{ep.overview}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}