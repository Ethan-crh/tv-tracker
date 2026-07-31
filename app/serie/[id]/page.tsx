"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/useConfirm";
import type { User } from "@supabase/supabase-js";
import TrailerModal from "@/components/TrailerModal";
import SimilarRow from "@/components/SimilarRow";

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
  videos?: {
    results: { key: string; site: string; type: string; iso_639_1?: string }[];
  };
  similar?: {
    results: { id: number; poster_path: string | null; name?: string }[];
  };
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

const CHUNK_SIZE = 400;

export default function SerieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tmdbId = parseInt(id, 10);
  const supabase = createClient();
  const { confirm, dialog } = useConfirm();

  const [show, setShow] = useState<ShowDetails | null>(null);
  const [activeSeason, setActiveSeason] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingShow, setLoadingShow] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set());

  // Cache en mémoire : une fois qu'une saison a été chargée, on ne la redemande plus à TMDB
  const seasonCache = useRef<Map<number, Episode[]>>(new Map());

  const getSeasonEpisodes = useCallback(
    async (seasonNumber: number, signal?: AbortSignal): Promise<Episode[]> => {
      const cached = seasonCache.current.get(seasonNumber);
      if (cached) return cached;

      const res = await fetch(`/api/tv/${id}/season/${seasonNumber}`, {
        signal,
      });
      const data = await res.json();
      const eps: Episode[] = data.episodes || [];

      seasonCache.current.set(seasonNumber, eps);
      return eps;
    },
    [id]
  );

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
        (s: Season) => s.season_number > 0
      );
      setActiveSeason(
        firstRealSeason
          ? firstRealSeason.season_number
          : data.seasons?.[0]?.season_number
      );
    }
    fetchShow();
  }, [id]);

  const refreshWatched = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("watched_episodes")
      .select("season_number, episode_number")
      .eq("user_id", user.id)
      .eq("tmdb_id", tmdbId);

    if (error) {
      console.error("Erreur récupération épisodes vus:", error);
      return;
    }

    setWatchedSet(
      new Set((data || []).map((w) => `${w.season_number}-${w.episode_number}`))
    );
  }, [user, tmdbId, supabase]);

  useEffect(() => {
    if (!user) return;

    async function fetchStatus() {
      const { data } = await supabase
        .from("user_shows")
        .select("status")
        .eq("user_id", user!.id)
        .eq("tmdb_id", tmdbId)
        .eq("media_type", "tv")
        .maybeSingle();

      if (data) setStatus(data.status as Status);
    }
    fetchStatus();
    refreshWatched();
  }, [user, tmdbId, supabase, refreshWatched]);

  // Chargement des épisodes de la saison active, via le cache en priorité
  useEffect(() => {
    if (activeSeason === null) return;

    const controller = new AbortController();

    async function fetchEpisodes() {
      setLoadingEpisodes(true);

      try {
        const eps = await getSeasonEpisodes(activeSeason as number, controller.signal);
        setEpisodes(eps);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Erreur chargement épisodes:", err);
        setEpisodes([]);
      } finally {
        if (!controller.signal.aborted) setLoadingEpisodes(false);
      }
    }

    fetchEpisodes();

    return () => controller.abort();
  }, [activeSeason, getSeasonEpisodes]);

  async function handleStatusChange(newStatus: Status) {
    if (!user || !show) return;

    if (status === newStatus) {
      setStatus(null);

      const { error } = await supabase
        .from("user_shows")
        .delete()
        .eq("user_id", user.id)
        .eq("tmdb_id", tmdbId)
        .eq("media_type", "tv");

      if (error) {
        console.error("Erreur suppression statut:", error);
      }
      return;
    }

    if (newStatus === "termine") {
      const confirmed = await confirm({
        title: "Marquer comme terminé",
        message:
          "Marquer cette série comme terminée va aussi cocher TOUS les épisodes de TOUTES les saisons comme vus. Continuer ?",
        confirmLabel: "Marquer terminé",
      });

      if (confirmed) {
        setBulkLoading(true);
        setBulkMessage("Enregistrement en cours...");

        const seasonsToMark = show.seasons.filter(
          (s) => s.season_number > 0 && s.episode_count > 0
        );

        const seasonEpisodes = await Promise.all(
          seasonsToMark.map(async (s) => ({
            season_number: s.season_number,
            episodes: await getSeasonEpisodes(s.season_number),
          }))
        );

        const rows = seasonEpisodes.flatMap((s) =>
          s.episodes.map((ep) => ({
            user_id: user.id,
            tmdb_id: tmdbId,
            season_number: s.season_number,
            episode_number: ep.episode_number,
          }))
        );

        const success = await batchUpsert(rows);
        await refreshWatched();
        setBulkMessage(success ? null : "⚠️ Une erreur est survenue, réessaie.");
        setBulkLoading(false);
      }
    }

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

  async function batchUpsert(
    rows: {
      user_id: string;
      tmdb_id: number;
      season_number: number;
      episode_number: number;
    }[]
  ): Promise<boolean> {
    const chunks: typeof rows[] = [];
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      chunks.push(rows.slice(i, i + CHUNK_SIZE));
    }

    let hasError = false;

    await Promise.all(
      chunks.map(async (chunk) => {
        const { error } = await supabase.from("watched_episodes").upsert(chunk, {
          onConflict: "user_id,tmdb_id,season_number,episode_number",
          ignoreDuplicates: true,
        });
        if (error) {
          console.error("Erreur upsert par lot:", error);
          hasError = true;
        }
      })
    );

    return !hasError;
  }

  const toggleEpisode = useCallback(
    async (seasonNumber: number, episodeNumber: number) => {
      if (!user) return;

      const key = `${seasonNumber}-${episodeNumber}`;
      const isWatched = watchedSet.has(key);

      if (isWatched) {
        const newSet = new Set(watchedSet);
        newSet.delete(key);
        setWatchedSet(newSet);

        const { error } = await supabase
          .from("watched_episodes")
          .delete()
          .eq("user_id", user.id)
          .eq("tmdb_id", tmdbId)
          .eq("season_number", seasonNumber)
          .eq("episode_number", episodeNumber);

        if (error) {
          console.error("Erreur suppression épisode:", error);
          await refreshWatched();
        }
        return;
      }

      const episodesToMark = episodes.filter(
        (ep) => ep.episode_number <= episodeNumber
      );
      if (episodesToMark.length === 0) return;

      const confirmed = await confirm({
        title: "Marquer comme vu",
        message:
          episodesToMark.length > 1
            ? `Marquer comme vus les ${episodesToMark.length} épisodes jusqu'à celui-ci ?`
            : `Marquer l'épisode ${episodeNumber} comme vu ?`,
        confirmLabel: "Marquer vu",
      });
      if (!confirmed) return;

      setBulkLoading(true);
      setBulkMessage("Enregistrement en cours...");

      const rows = episodesToMark.map((ep) => ({
        user_id: user.id,
        tmdb_id: tmdbId,
        season_number: seasonNumber,
        episode_number: ep.episode_number,
      }));

      const newSet = new Set(watchedSet);
      rows.forEach((r) => newSet.add(`${r.season_number}-${r.episode_number}`));
      setWatchedSet(newSet);

      const success = await batchUpsert(rows);
      await refreshWatched();

      setBulkMessage(success ? null : "⚠️ Une erreur est survenue, réessaie.");
      setBulkLoading(false);
    },
    [user, tmdbId, watchedSet, supabase, refreshWatched, episodes, confirm]
  );

  async function markUpToSeasonWatched(targetSeason: number) {
    if (!user || !show) return;

    const seasonsToMark = show.seasons.filter(
      (s) => s.season_number > 0 && s.season_number <= targetSeason && s.episode_count > 0
    );

    const confirmed = await confirm({
      title: "Tout marquer vu",
      message: `Marquer comme vues toutes les saisons de 1 à ${targetSeason} ?`,
      confirmLabel: "Tout marquer",
    });
    if (!confirmed) return;

    setBulkLoading(true);
    setBulkMessage("Récupération des épisodes...");

    try {
      const seasonEpisodes = await Promise.all(
        seasonsToMark.map(async (s) => ({
          season_number: s.season_number,
          episodes: await getSeasonEpisodes(s.season_number),
        }))
      );

      const rows = seasonEpisodes.flatMap((s) =>
        s.episodes.map((ep) => ({
          user_id: user.id,
          tmdb_id: tmdbId,
          season_number: s.season_number,
          episode_number: ep.episode_number,
        }))
      );

      setBulkMessage(`Enregistrement de ${rows.length} épisodes...`);

      const newSet = new Set(watchedSet);
      rows.forEach((r) => newSet.add(`${r.season_number}-${r.episode_number}`));
      setWatchedSet(newSet);

      const success = await batchUpsert(rows);
      await refreshWatched();

      setBulkMessage(success ? null : "⚠️ Une erreur est survenue, réessaie.");
    } catch (err) {
      console.error("Erreur marquage multi-saisons:", err);
      setBulkMessage("⚠️ Une erreur est survenue, réessaie.");
    } finally {
      setBulkLoading(false);
    }
  }

  async function unmarkFromSeasonWatched(targetSeason: number) {
    if (!user) return;

    const confirmed = await confirm({
      title: "Tout décocher",
      message: `Décocher tous les épisodes de la saison ${targetSeason} et de toutes les saisons suivantes ?`,
      confirmLabel: "Décocher",
      danger: true,
    });
    if (!confirmed) return;

    setBulkLoading(true);
    setBulkMessage("Suppression en cours...");

    const { error } = await supabase
      .from("watched_episodes")
      .delete()
      .eq("user_id", user.id)
      .eq("tmdb_id", tmdbId)
      .gte("season_number", targetSeason);

    if (error) {
      console.error("Erreur décochage multi-saisons:", error);
      setBulkMessage("⚠️ Une erreur est survenue, réessaie.");
    } else {
      setBulkMessage(null);
    }

    await refreshWatched();
    setBulkLoading(false);
  }

  async function resetAllWatched() {
    if (!user) return;

    const confirmed = await confirm({
      title: "Réinitialiser la progression",
      message:
        "Ceci va supprimer TOUT l'historique d'épisodes vus pour cette série (utile si ta progression semble incorrecte à cause d'un ancien bug). Cette action est irréversible. Continuer ?",
      confirmLabel: "Tout réinitialiser",
      danger: true,
    });
    if (!confirmed) return;

    setBulkLoading(true);
    setBulkMessage("Réinitialisation en cours...");

    const { error } = await supabase
      .from("watched_episodes")
      .delete()
      .eq("user_id", user.id)
      .eq("tmdb_id", tmdbId);

    if (error) {
      console.error("Erreur réinitialisation:", error);
      setBulkMessage("⚠️ Une erreur est survenue, réessaie.");
    } else {
      setBulkMessage(null);
    }

    await refreshWatched();
    setBulkLoading(false);
  }

  if (loadingShow) return <p className="p-8">Chargement...</p>;
  if (!show) return <p className="p-8">Série introuvable.</p>;

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-8">
      {dialog}

      <div className="flex flex-col gap-6 mb-6 sm:flex-row">
        {show.poster_path && (
          <Image
            src={`https://image.tmdb.org/t/p/w342${show.poster_path}`}
            alt={show.name}
            width={200}
            height={300}
            className="mx-auto rounded-sm border-4 border-[#111111] sm:mx-0"
          />
        )}
        <div>
          <h1 className="font-display text-2xl uppercase mb-2 text-[#111111] sm:text-3xl">
            {show.name}
          </h1>
          <p className="text-[#3a3a3a] mb-4">{show.overview}</p>

          {user ? (
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`manga-btn px-3 py-1.5 text-xs font-bold ${
                    status === s
                      ? "bg-[#E1263F] text-white"
                      : "bg-white text-[#111111]"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B6B6B]">
              Connecte-toi pour suivre cette série.
            </p>
          )}

          <div className="mt-3">
            <TrailerModal videos={show.videos?.results} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {show.seasons
          .filter((s) => s.episode_count > 0)
          .map((season) => (
            <button
              key={season.id}
              onClick={() => setActiveSeason(season.season_number)}
              className={`manga-btn shrink-0 px-4 py-2 text-xs font-bold whitespace-nowrap ${
                activeSeason === season.season_number
                  ? "bg-[#E1263F] text-white"
                  : "bg-white text-[#111111]"
              }`}
            >
              {season.name}
            </button>
          ))}
      </div>

      {user && activeSeason !== null && activeSeason > 0 && (
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => markUpToSeasonWatched(activeSeason)}
            disabled={bulkLoading}
            className="manga-btn bg-[#111111] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            ✓ Tout marquer vu (jusqu&apos;à la saison {activeSeason})
          </button>
          <button
            onClick={() => unmarkFromSeasonWatched(activeSeason)}
            disabled={bulkLoading}
            className="manga-btn bg-[#E1263F] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            ✕ Tout décocher (à partir de la saison {activeSeason})
          </button>
          <button
            onClick={resetAllWatched}
            disabled={bulkLoading}
            className="manga-btn bg-white px-4 py-2 text-xs font-bold text-[#6B6B6B] disabled:opacity-50"
          >
            ⟲ Réinitialiser toute la progression
          </button>
        </div>
      )}

      {bulkMessage && (
        <p className="mb-4 font-mono-utility text-xs text-[#6B6B6B]">
          {bulkMessage}
        </p>
      )}

      {loadingEpisodes ? (
        <p className="text-[#3a3a3a]">Chargement des épisodes...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {episodes.map((ep) => {
            const key = `${ep.season_number ?? activeSeason}-${ep.episode_number}`;
            const isWatched = watchedSet.has(key);

            return (
              <div
                key={ep.id}
                className={`flex gap-4 p-3 items-start border-4 border-[#111111] transition ${
                  isWatched ? "bg-[#FFD400]/20" : "bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isWatched}
                  onChange={() =>
                    toggleEpisode(activeSeason!, ep.episode_number)
                  }
                  disabled={!user || bulkLoading}
                  className="mt-1 w-5 h-5 cursor-pointer accent-[#E1263F] disabled:cursor-not-allowed"
                />
                <div>
                  <p className="font-bold text-[#111111]">
                    E{ep.episode_number} · {ep.name}
                  </p>
                  <p className="font-mono-utility text-xs text-[#6B6B6B] mb-1">
                    {ep.air_date}
                  </p>
                  <p className="text-sm text-[#3a3a3a]">{ep.overview}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <SimilarRow
        items={show.similar?.results}
        mediaType="tv"
        title="Séries similaires"
      />
    </main>
  );
}