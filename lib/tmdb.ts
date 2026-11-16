/**
 * Accès à l'API TMDB — à n'utiliser que côté serveur (la clé ne doit jamais
 * partir dans le navigateur). Toutes les réponses sont réduites aux champs
 * réellement utilisés par l'interface.
 */
import type {
  Backdrop,
  CastMember,
  Episode,
  MediaCard,
  MediaKind,
  MediaType,
  MovieDetails,
  ShowDetails,
  TitleSummary,
  UpcomingMovie,
  Video,
} from "@/lib/types";

const BASE_URL = "https://api.themoviedb.org/3";

const HOUR = 3600;

/** Séries exclues de toutes les listes et recherches. */
const BLOCKED_TV_IDS = new Set<number>([
  45950, // High School DxD
  96444, // Interspecies Reviewers
  34742, // To LOVE-Ru
  46414, // Kanokon
]);

const ANIMATION_GENRE = 16;
const EXCLUDED_ANIME_KEYWORD = "198385";

const DEFAULT_EPISODE_MINUTES = 42;
const DEFAULT_ANIME_EPISODE_MINUTES = 24;
const DEFAULT_MOVIE_MINUTES = 110;

export class TmdbError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

type Params = Record<string, string | number | undefined>;

async function tmdb<T>(
  path: string,
  params: Params = {},
  revalidate: number = HOUR,
): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new TmdbError(500, "Variable d'environnement TMDB_API_KEY manquante.");
  }

  const url = new URL(BASE_URL + path);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "fr-FR");
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    throw new TmdbError(res.status, `TMDB a répondu ${res.status} sur ${path}`);
  }
  return res.json() as Promise<T>;
}

/** Valide un identifiant venant d'une URL. Renvoie null s'il n'est pas un entier positif. */
export function parseId(value: string): number | null {
  if (!/^\d{1,9}$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}

// ---------------------------------------------------------------------------
// Formes brutes TMDB (uniquement les champs lus)
// ---------------------------------------------------------------------------

type RawListItem = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  popularity?: number;
  genre_ids?: number[];
  origin_country?: string[];
};

type RawPage = { results?: RawListItem[] };

type RawVideos = { results?: Video[] };

function kindOf(
  mediaType: MediaType,
  genreIds: number[] | undefined,
  originCountry: string[] | undefined,
): MediaKind {
  if (mediaType === "movie") return "movie";
  const isAnime =
    genreIds?.includes(ANIMATION_GENRE) && originCountry?.includes("JP");
  return isAnime ? "anime" : "tv";
}

function toCard(item: RawListItem, mediaType: MediaType): MediaCard {
  const date = item.release_date || item.first_air_date || "";
  return {
    id: item.id,
    media_type: mediaType,
    kind: kindOf(mediaType, item.genre_ids, item.origin_country),
    title: item.title || item.name || "Sans titre",
    poster_path: item.poster_path ?? null,
    year: date ? date.slice(0, 4) : null,
    vote_average: item.vote_average || 0,
  };
}

function isAllowed(item: RawListItem, mediaType: MediaType) {
  return mediaType === "movie" || !BLOCKED_TV_IDS.has(item.id);
}

function pickTrailer(videos: RawVideos | undefined): Video | null {
  const youtube = (videos?.results || []).filter((v) => v.site === "YouTube");
  const found =
    youtube.find((v) => v.type === "Trailer" && v.iso_639_1 === "fr") ||
    youtube.find((v) => v.type === "Trailer") ||
    youtube.find((v) => v.type === "Teaser") ||
    youtube[0];
  return found
    ? { key: found.key, site: found.site, type: found.type }
    : null;
}

/** Garde la première occurrence de chaque titre (même type, même id). */
function uniqueItems(items: RawListItem[]): RawListItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.media_type ?? ""}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Plusieurs pages d'une liste TMDB, sans doublons : le classement bouge
 * entre deux pages (et chaque page est mise en cache séparément), donc un
 * même titre peut apparaître en bas de la page 1 et en haut de la page 2.
 */
async function fetchPages(
  path: string,
  params: Params,
  pages: number,
  revalidate: number,
): Promise<RawListItem[]> {
  const responses = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      tmdb<RawPage>(path, { ...params, page: i + 1 }, revalidate),
    ),
  );
  return uniqueItems(responses.flatMap((r) => r.results || []));
}

// ---------------------------------------------------------------------------
// Listes
// ---------------------------------------------------------------------------

export type TopCategory = "films" | "series" | "animes";

const TOP_QUERIES: Record<
  TopCategory,
  { path: string; params: Params; mediaType: MediaType }
> = {
  films: { path: "/movie/popular", params: {}, mediaType: "movie" },
  series: {
    path: "/discover/tv",
    params: {
      sort_by: "popularity.desc",
      without_genres: ANIMATION_GENRE,
      "vote_count.gte": 100,
    },
    mediaType: "tv",
  },
  animes: {
    path: "/discover/tv",
    params: {
      sort_by: "popularity.desc",
      with_genres: ANIMATION_GENRE,
      with_origin_country: "JP",
      without_keywords: EXCLUDED_ANIME_KEYWORD,
      "vote_count.gte": 100,
    },
    mediaType: "tv",
  },
};

export async function getTopItems(
  category: TopCategory,
  limit = 30,
): Promise<MediaCard[]> {
  const { path, params, mediaType } = TOP_QUERIES[category];
  const items = await fetchPages(path, params, Math.ceil(limit / 20), HOUR);
  return items
    .filter((item) => item.poster_path && isAllowed(item, mediaType))
    .slice(0, limit)
    .map((item) => ({
      ...toCard(item, mediaType),
      kind: category === "animes" ? "anime" : toCard(item, mediaType).kind,
    }));
}

export async function getBackdrops(): Promise<Backdrop[]> {
  const categories: TopCategory[] = ["films", "series", "animes"];
  const lists = await Promise.all(
    categories.map(async (category) => {
      const { path, params, mediaType } = TOP_QUERIES[category];
      const items = await fetchPages(path, params, 1, 6 * HOUR);
      return items
        .filter((item) => item.backdrop_path && isAllowed(item, mediaType))
        .slice(0, 8)
        .map((item) => ({
          id: item.id,
          media_type: mediaType,
          backdrop_path: item.backdrop_path as string,
          title: item.title || item.name || "",
        }));
    }),
  );

  // On alterne film / série / anime pour varier le carrousel, sans jamais
  // montrer deux fois le même titre ni la même image.
  const mixed: Backdrop[] = [];
  const seen = new Set<string>();
  const longest = Math.max(...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      const item = list[i];
      if (!item) continue;
      const titleKey = `${item.media_type}-${item.id}`;
      if (seen.has(titleKey) || seen.has(item.backdrop_path)) continue;
      seen.add(titleKey);
      seen.add(item.backdrop_path);
      mixed.push(item);
    }
  }
  return mixed;
}

export async function getUpcomingMovies(): Promise<UpcomingMovie[]> {
  const items = await fetchPages(
    "/movie/upcoming",
    { region: "FR" },
    2,
    HOUR,
  );
  const seen = new Set<number>();
  return items
    .filter((m) => {
      if (!m.release_date || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .sort((a, b) => (a.release_date as string).localeCompare(b.release_date as string))
    .map((m) => ({
      id: m.id,
      title: m.title || "Sans titre",
      poster_path: m.poster_path ?? null,
      release_date: m.release_date as string,
    }));
}

// ---------------------------------------------------------------------------
// Recherche & découverte
// ---------------------------------------------------------------------------

export async function searchTitles(query: string): Promise<MediaCard[]> {
  const data = await tmdb<RawPage>(
    "/search/multi",
    { query, include_adult: "false" },
    600,
  );
  return uniqueItems(data.results || [])
    .filter(
      (item): item is RawListItem & { media_type: MediaType } =>
        (item.media_type === "movie" || item.media_type === "tv") &&
        isAllowed(item, item.media_type),
    )
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .map((item) => toCard(item, item.media_type));
}

/** Titres populaires du moment, utilisés pour corriger les fautes de frappe. */
export async function getPopularTitleNames(): Promise<string[]> {
  const lists = await Promise.all([
    tmdb<RawPage>("/trending/all/week", {}, 6 * HOUR),
    tmdb<RawPage>("/movie/popular", {}, 6 * HOUR),
    tmdb<RawPage>("/tv/popular", {}, 6 * HOUR),
    tmdb<RawPage>(
      "/discover/tv",
      {
        with_genres: ANIMATION_GENRE,
        with_origin_country: "JP",
        sort_by: "popularity.desc",
        "vote_count.gte": 50,
      },
      6 * HOUR,
    ),
  ].map((p) => p.catch(() => ({ results: [] }) as RawPage)));

  const names = lists
    .flatMap((l) => l.results || [])
    .filter((item) => item.media_type !== "person")
    .map((item) => item.title || item.name)
    .filter((name): name is string => Boolean(name));
  return Array.from(new Set(names));
}

export type DiscoverType = "movie" | "serie" | "anime";
export type DiscoverSort = "popularity.desc" | "vote_average.desc" | "release_date.desc";

export async function discoverTitles(
  type: DiscoverType,
  genres: number[],
  sort: DiscoverSort,
): Promise<MediaCard[]> {
  const mediaType: MediaType = type === "movie" ? "movie" : "tv";
  const sortBy =
    sort === "release_date.desc"
      ? mediaType === "movie"
        ? "primary_release_date.desc"
        : "first_air_date.desc"
      : sort;

  // Pour « plus récents », on ne garde que ce qui est déjà sorti.
  const today = new Date().toISOString().slice(0, 10);
  const params: Params = {
    sort_by: sortBy,
    "vote_count.gte": type === "anime" ? 100 : 50,
  };
  if (sort === "release_date.desc") {
    params[mediaType === "movie" ? "primary_release_date.lte" : "first_air_date.lte"] = today;
  }

  if (type === "movie") {
    params.with_genres = genres.join(",");
  } else if (type === "serie") {
    params.with_genres = genres.join(",");
    params.without_genres = ANIMATION_GENRE;
  } else {
    params.with_genres = [ANIMATION_GENRE, ...genres].join(",");
    params.with_origin_country = "JP";
    params.without_keywords = EXCLUDED_ANIME_KEYWORD;
  }

  const items = await fetchPages(`/discover/${mediaType}`, params, 2, 1800);
  return items
    .filter((item) => item.poster_path && isAllowed(item, mediaType))
    .slice(0, 40)
    .map((item) => ({
      ...toCard(item, mediaType),
      kind: type === "anime" ? "anime" : toCard(item, mediaType).kind,
    }));
}

// ---------------------------------------------------------------------------
// Fiches détaillées
// ---------------------------------------------------------------------------

type RawGenre = { id: number; name: string };

type RawMovie = {
  id: number;
  title: string;
  tagline?: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  runtime?: number | null;
  vote_average?: number;
  genres?: RawGenre[];
  videos?: RawVideos;
  credits?: { cast?: CastMember[] };
  similar?: RawPage;
};

type RawShow = {
  id: number;
  name: string;
  tagline?: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  status?: string;
  number_of_episodes?: number;
  vote_average?: number;
  genres?: RawGenre[];
  origin_country?: string[];
  episode_run_time?: number[];
  last_episode_to_air?: { runtime?: number | null } | null;
  next_episode_to_air?: {
    air_date?: string | null;
    episode_number: number;
    season_number: number;
    name?: string;
  } | null;
  seasons?: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
  }[];
  videos?: RawVideos;
  aggregate_credits?: {
    cast?: {
      id: number;
      name: string;
      profile_path: string | null;
      roles?: { character?: string }[];
    }[];
  };
  similar?: RawPage;
};

const SHOW_STATUS_LABELS: Record<string, string> = {
  "Returning Series": "En cours de diffusion",
  Ended: "Terminée",
  Canceled: "Annulée",
  "In Production": "En production",
  Planned: "Annoncée",
};

function showKind(show: RawShow): MediaKind {
  return kindOf(
    "tv",
    show.genres?.map((g) => g.id),
    show.origin_country,
  );
}

export async function getMovie(id: number): Promise<MovieDetails> {
  const raw = await tmdb<RawMovie>(`/movie/${id}`, {
    append_to_response: "videos,credits,similar",
    include_video_language: "fr,en",
  });

  return {
    id: raw.id,
    title: raw.title,
    tagline: raw.tagline || "",
    overview: raw.overview || "",
    poster_path: raw.poster_path,
    backdrop_path: raw.backdrop_path,
    release_date: raw.release_date || null,
    runtime: raw.runtime || null,
    vote_average: raw.vote_average || 0,
    genres: raw.genres || [],
    trailer: pickTrailer(raw.videos),
    cast: (raw.credits?.cast || []).slice(0, 14).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profile_path,
    })),
    similar: uniqueItems(raw.similar?.results || [])
      .filter((item) => item.poster_path && item.id !== raw.id)
      .slice(0, 16)
      .map((item) => toCard(item, "movie")),
  };
}

export async function getShow(id: number): Promise<ShowDetails> {
  if (BLOCKED_TV_IDS.has(id)) throw new TmdbError(404, "Série indisponible.");

  const raw = await tmdb<RawShow>(`/tv/${id}`, {
    append_to_response: "videos,aggregate_credits,similar",
    include_video_language: "fr,en",
  });

  return {
    id: raw.id,
    name: raw.name,
    tagline: raw.tagline || "",
    overview: raw.overview || "",
    poster_path: raw.poster_path,
    backdrop_path: raw.backdrop_path,
    first_air_date: raw.first_air_date || null,
    kind: showKind(raw),
    status_label: raw.status ? SHOW_STATUS_LABELS[raw.status] || null : null,
    number_of_episodes: raw.number_of_episodes || 0,
    vote_average: raw.vote_average || 0,
    genres: raw.genres || [],
    seasons: (raw.seasons || [])
      .filter((s) => s.episode_count > 0)
      .map((s) => ({
        id: s.id,
        name: s.name,
        season_number: s.season_number,
        episode_count: s.episode_count,
      })),
    trailer: pickTrailer(raw.videos),
    cast: (raw.aggregate_credits?.cast || []).slice(0, 14).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.roles?.[0]?.character || "",
      profile_path: c.profile_path,
    })),
    similar: uniqueItems(raw.similar?.results || [])
      .filter((item) => item.poster_path && item.id !== raw.id && isAllowed(item, "tv"))
      .slice(0, 16)
      .map((item) => toCard(item, "tv")),
  };
}

type RawSeason = {
  episodes?: {
    id: number;
    episode_number: number;
    name?: string;
    overview?: string;
    air_date?: string | null;
    still_path?: string | null;
    runtime?: number | null;
  }[];
};

export async function getSeasonEpisodes(
  showId: number,
  seasonNumber: number,
): Promise<Episode[]> {
  const raw = await tmdb<RawSeason>(`/tv/${showId}/season/${seasonNumber}`);
  return (raw.episodes || []).map((ep) => ({
    id: ep.id,
    episode_number: ep.episode_number,
    name: ep.name || `Épisode ${ep.episode_number}`,
    overview: ep.overview || "",
    air_date: ep.air_date || null,
    still_path: ep.still_path ?? null,
    runtime: ep.runtime ?? null,
  }));
}

/** Résumé léger d'un titre : de quoi alimenter listes, calendrier et stats. */
export async function getTitleSummary(
  mediaType: MediaType,
  id: number,
): Promise<TitleSummary> {
  if (mediaType === "movie") {
    const raw = await tmdb<RawMovie>(`/movie/${id}`);
    return {
      id: raw.id,
      media_type: "movie",
      kind: "movie",
      title: raw.title,
      poster_path: raw.poster_path,
      genres: (raw.genres || []).map((g) => g.name),
      runtime: raw.runtime || DEFAULT_MOVIE_MINUTES,
      number_of_episodes: 1,
      next_episode: null,
    };
  }

  const raw = await tmdb<RawShow>(`/tv/${id}`);
  const kind = showKind(raw);
  const next = raw.next_episode_to_air;
  return {
    id: raw.id,
    media_type: "tv",
    kind,
    title: raw.name,
    poster_path: raw.poster_path,
    genres: (raw.genres || []).map((g) => g.name),
    runtime:
      raw.episode_run_time?.[0] ||
      raw.last_episode_to_air?.runtime ||
      (kind === "anime" ? DEFAULT_ANIME_EPISODE_MINUTES : DEFAULT_EPISODE_MINUTES),
    number_of_episodes: raw.number_of_episodes || 0,
    next_episode:
      next && next.air_date
        ? {
            air_date: next.air_date,
            episode_number: next.episode_number,
            season_number: next.season_number,
            name: next.name || "",
          }
        : null,
  };
}
