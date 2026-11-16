/**
 * Accès aux données de l'utilisateur (Supabase) et aux résumés de titres,
 * côté navigateur.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaType, Status, TitleSummary } from "@/lib/types";

export type UserShow = {
  tmdb_id: number;
  media_type: MediaType;
  status: Status;
};

const PAGE_SIZE = 1000;

/**
 * Supabase plafonne chaque requête à 1000 lignes : sans pagination, la
 * progression d'un gros compte (ou d'une série de plus de 1000 épisodes)
 * serait silencieusement tronquée.
 */
async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export async function fetchUserShows(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserShow[]> {
  return fetchAllRows<UserShow>((from, to) =>
    supabase
      .from("user_shows")
      .select("tmdb_id, media_type, status")
      .eq("user_id", userId)
      .order("tmdb_id")
      .range(from, to),
  );
}

/** Nombre d'épisodes vus par série, pour tout le compte. */
export async function fetchWatchedCounts(
  supabase: SupabaseClient,
  userId: string,
): Promise<Map<number, number>> {
  const rows = await fetchAllRows<{ tmdb_id: number }>((from, to) =>
    supabase
      .from("watched_episodes")
      .select("tmdb_id")
      .eq("user_id", userId)
      .order("tmdb_id")
      .order("season_number")
      .order("episode_number")
      .range(from, to),
  );

  const counts = new Map<number, number>();
  for (const row of rows) {
    counts.set(row.tmdb_id, (counts.get(row.tmdb_id) || 0) + 1);
  }
  return counts;
}

/** Clés "saison-épisode" des épisodes vus d'une série. */
export async function fetchWatchedEpisodes(
  supabase: SupabaseClient,
  userId: string,
  tmdbId: number,
): Promise<Set<string>> {
  const rows = await fetchAllRows<{ season_number: number; episode_number: number }>(
    (from, to) =>
      supabase
        .from("watched_episodes")
        .select("season_number, episode_number")
        .eq("user_id", userId)
        .eq("tmdb_id", tmdbId)
        .order("season_number")
        .order("episode_number")
        .range(from, to),
  );
  return new Set(rows.map((r) => episodeKey(r.season_number, r.episode_number)));
}

export function episodeKey(season: number, episode: number) {
  return `${season}-${episode}`;
}

export function titleKey(mediaType: MediaType, id: number) {
  return `${mediaType}:${id}`;
}

const TITLES_PER_REQUEST = 50;

/** Résumés TMDB des titres suivis, par lots, indexés par "type:id". */
export async function fetchTitleSummaries(
  shows: { tmdb_id: number; media_type: MediaType }[],
): Promise<Map<string, TitleSummary>> {
  const keys = shows.map((s) => titleKey(s.media_type, s.tmdb_id));
  const batches: string[][] = [];
  for (let i = 0; i < keys.length; i += TITLES_PER_REQUEST) {
    batches.push(keys.slice(i, i + TITLES_PER_REQUEST));
  }

  const responses = await Promise.all(
    batches.map(async (batch) => {
      const res = await fetch(`/api/titles?items=${batch.join(",")}`);
      if (!res.ok) throw new Error("Impossible de charger les titres.");
      const data: { titles: TitleSummary[] } = await res.json();
      return data.titles;
    }),
  );

  const map = new Map<string, TitleSummary>();
  for (const title of responses.flat()) {
    map.set(titleKey(title.media_type, title.id), title);
  }
  return map;
}
