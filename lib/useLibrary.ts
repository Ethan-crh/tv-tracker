"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  fetchTitleSummaries,
  fetchUserShows,
  fetchWatchedCounts,
  titleKey,
  type UserShow,
} from "@/lib/library";
import type { TitleSummary } from "@/lib/types";

export type LibraryEntry = UserShow & {
  /** null si le titre n'existe plus sur TMDB. */
  summary: TitleSummary | null;
  /** Épisodes vus (séries), plafonné au nombre d'épisodes existants. */
  watched: number;
};

export type LibraryState =
  | { phase: "loading" }
  | { phase: "signed-out" }
  | { phase: "error" }
  | { phase: "ready"; entries: LibraryEntry[] };

/**
 * Bibliothèque complète de l'utilisateur : titres suivis, enrichis des
 * infos TMDB et du nombre d'épisodes vus. Trois requêtes Supabase paginées
 * et une requête TMDB par lot de 50 titres, quel que soit le nombre de titres.
 */
export function useLibrary(): LibraryState {
  const { supabase, user, loading } = useAuth();
  const [result, setResult] = useState<{
    userId: string;
    state: LibraryState;
  } | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;

    (async () => {
      const [shows, counts] = await Promise.all([
        fetchUserShows(supabase, userId),
        fetchWatchedCounts(supabase, userId),
      ]);
      const summaries = await fetchTitleSummaries(shows);

      return shows.map((show): LibraryEntry => {
        const summary = summaries.get(titleKey(show.media_type, show.tmdb_id)) ?? null;
        const seen = show.media_type === "tv" ? counts.get(show.tmdb_id) || 0 : 0;
        return {
          ...show,
          summary,
          watched: summary ? Math.min(seen, summary.number_of_episodes) : seen,
        };
      });
    })()
      .then((entries) => {
        if (active) setResult({ userId, state: { phase: "ready", entries } });
      })
      .catch((error) => {
        console.error("Chargement de la bibliothèque impossible :", error);
        if (active) setResult({ userId, state: { phase: "error" } });
      });

    return () => {
      active = false;
    };
  }, [supabase, userId]);

  if (loading) return { phase: "loading" };
  if (!userId) return { phase: "signed-out" };
  return result?.userId === userId ? result.state : { phase: "loading" };
}
