export type MediaType = "movie" | "tv";

/** Type affiché à l'utilisateur : un anime est une série TV japonaise d'animation. */
export type MediaKind = "movie" | "tv" | "anime";

export type Status = "a_voir" | "en_cours" | "termine" | "abandonne";

export const STATUS_ORDER: Status[] = [
  "en_cours",
  "a_voir",
  "termine",
  "abandonne",
];

export const STATUS_LABELS: Record<Status, string> = {
  a_voir: "À voir",
  en_cours: "En cours",
  termine: "Terminé",
  abandonne: "Abandonné",
};

export const KIND_LABELS: Record<MediaKind, string> = {
  movie: "Film",
  tv: "Série",
  anime: "Anime",
};

/** Carte d'affiche : la forme minimale partagée par toutes les listes. */
export type MediaCard = {
  id: number;
  media_type: MediaType;
  kind: MediaKind;
  title: string;
  poster_path: string | null;
  year: string | null;
  vote_average: number;
};

export type Backdrop = {
  id: number;
  media_type: MediaType;
  backdrop_path: string;
  title: string;
};

export type UpcomingMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
};

export type Video = {
  key: string;
  site: string;
  type: string;
  iso_639_1?: string;
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

export type Genre = { id: number; name: string };

export type MovieDetails = {
  id: number;
  title: string;
  tagline: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  runtime: number | null;
  vote_average: number;
  genres: Genre[];
  trailer: Video | null;
  cast: CastMember[];
  similar: MediaCard[];
};

export type Season = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
};

export type ShowDetails = {
  id: number;
  name: string;
  tagline: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  kind: MediaKind;
  status_label: string | null;
  number_of_episodes: number;
  vote_average: number;
  genres: Genre[];
  seasons: Season[];
  trailer: Video | null;
  cast: CastMember[];
  similar: MediaCard[];
};

export type Episode = {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  still_path: string | null;
  runtime: number | null;
};

export type NextEpisode = {
  air_date: string;
  episode_number: number;
  season_number: number;
  name: string;
};

/** Résumé léger d'un titre suivi, servi par lots via /api/titles. */
export type TitleSummary = {
  id: number;
  media_type: MediaType;
  kind: MediaKind;
  title: string;
  poster_path: string | null;
  genres: string[];
  /** Films : durée du film. Séries : durée typique d'un épisode. */
  runtime: number;
  number_of_episodes: number;
  next_episode: NextEpisode | null;
};
