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
  const [bulkLoading, setBulkLoading] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    async function fetchShow() {
      setLoadingShow(true);
      const res = await fetch(`/api/tv/${id}`);
      const data = await res.json();
      setShow(data);
      setLoadingShow(false);

      const firstRealSeason = data.seasons?.find(
        (s: Season) => s.season_number > 0,
      );
      setActiveSeason(
        firstRealSeason
          ? firstRealSeason.season_number
          : data.seasons?.[0]?.season_number,
      );
    }
    fetchShow();
  }, [id]);

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
          watchedData.map((w) => `${w.season_number}-${w.episode_number}`),
        );
        setWatchedSet(set);
      }
    }
    fetchUserData();
  }, [user, tmdbId, supabase]);

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
      { onConflict: "user_id,tmdb_id,media_type" },
    );
  }

  const toggleEpisode = useCallback(
    async (seasonNumber: number, episodeNumber: number) => {
      if (!user || !show) return;

      const key = `${seasonNumber}-${episodeNumber}`;
      const isWatched = watchedSet.has(key);

      if (isWatched) {
        // Décocher : on retire uniquement cet épisode (comportement simple existant)
        const newSet = new Set(watchedSet);
        newSet.delete(key);
        setWatchedSet(newSet);

        await supabase
          .from("watched_episodes")
          .delete()
          .eq("user_id", user.id)
          .eq("tmdb_id", tmdbId)
          .eq("season_number", seasonNumber)
          .eq("episode_number", episodeNumber);
        return;
      }

      // Cocher : on construit la liste de TOUS les épisodes à marquer comme vus
      // 1. toutes les saisons précédentes (entières)
      // 2. la saison courante, du début jusqu'à l'épisode cliqué
      const toMark: { season_number: number; episode_number: number }[] = [];

      show.seasons
        .filter((s) => s.season_number > 0 && s.episode_count > 0) // on ignore les "Spéciaux" (saison 0)
        .forEach((s) => {
          if (s.season_number < seasonNumber) {
            for (let ep = 1; ep <= s.episode_count; ep++) {
              const k = `${s.season_number}-${ep}`;
              if (!watchedSet.has(k)) {
                toMark.push({
                  season_number: s.season_number,
                  episode_number: ep,
                });
              }
            }
          } else if (s.season_number === seasonNumber) {
            for (let ep = 1; ep <= episodeNumber; ep++) {
              const k = `${s.season_number}-${ep}`;
              if (!watchedSet.has(k)) {
                toMark.push({
                  season_number: s.season_number,
                  episode_number: ep,
                });
              }
            }
          }
        });

      if (toMark.length === 0) return;

      // Mise à jour optimiste de l'UI
      const newSet = new Set(watchedSet);
      toMark.forEach((e) =>
        newSet.add(`${e.season_number}-${e.episode_number}`),
      );
      setWatchedSet(newSet);

      // Insertion en masse (upsert pour éviter les doublons si conflit)
      await supabase.from("watched_episodes").upsert(
        toMark.map((e) => ({
          user_id: user.id,
          tmdb_id: tmdbId,
          season_number: e.season_number,
          episode_number: e.episode_number,
        })),
        {
          onConflict: "user_id,tmdb_id,season_number,episode_number",
          ignoreDuplicates: true,
        },
      );
    },
    [user, tmdbId, watchedSet, supabase, show],
  );

  // Marque comme vue la saison ciblée ET toutes les saisons précédentes
  async function markUpToSeasonWatched(targetSeason: number) {
    if (!user || !show) return;

    setBulkLoading(true);

    const seasonsToMark = show.seasons.filter(
      (s) => s.season_number > 0 && s.season_number <= targetSeason,
    );

    const rows = seasonsToMark.flatMap((s) =>
      Array.from({ length: s.episode_count }, (_, i) => ({
        user_id: user.id,
        tmdb_id: tmdbId,
        season_number: s.season_number,
        episode_number: i + 1,
      })),
    );

    const newSet = new Set(watchedSet);
    rows.forEach((r) => newSet.add(`${r.season_number}-${r.episode_number}`));
    setWatchedSet(newSet);

    await supabase.from("watched_episodes").upsert(rows, {
      onConflict: "user_id,tmdb_id,season_number,episode_number",
    });

    setBulkLoading(false);
  }

  if (loadingShow) return <p className="p-8">Chargement...</p>;
  if (!show) return <p className="p-8">Série introuvable.</p>;

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col gap-6 mb-6 sm:flex-row">
        {show.poster_path && (
          <Image
            src={`https://image.tmdb.org/t/p/w342${show.poster_path}`}
            alt={show.name}
            width={200}
            height={300}
            className="mx-auto rounded-lg sm:mx-0"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold mb-2 sm:text-3xl">{show.name}</h1>
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

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
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

      {user && activeSeason !== null && activeSeason > 0 && (
        <button
          onClick={() => markUpToSeasonWatched(activeSeason)}
          disabled={bulkLoading}
          className="mb-6 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition disabled:opacity-50"
        >
          {bulkLoading
            ? "Enregistrement..."
            : `✓ Tout marquer vu (jusqu'à la saison ${activeSeason})`}
        </button>
      )}

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
