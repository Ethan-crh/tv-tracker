// Identifiants de genres TMDB (stables et documentés).
export const MOVIE_GENRES = [
  { id: 28, label: "Action" },
  { id: 12, label: "Aventure" },
  { id: 35, label: "Comédie" },
  { id: 80, label: "Crime" },
  { id: 99, label: "Documentaire" },
  { id: 18, label: "Drame" },
  { id: 10751, label: "Familial" },
  { id: 14, label: "Fantastique" },
  { id: 27, label: "Horreur" },
  { id: 9648, label: "Mystère" },
  { id: 10749, label: "Romance" },
  { id: 878, label: "Science-Fiction" },
  { id: 53, label: "Thriller" },
  { id: 10752, label: "Guerre" },
];

export const TV_GENRES = [
  { id: 10759, label: "Action & Aventure" },
  { id: 35, label: "Comédie" },
  { id: 80, label: "Crime" },
  { id: 99, label: "Documentaire" },
  { id: 18, label: "Drame" },
  { id: 10751, label: "Familial" },
  { id: 9648, label: "Mystère" },
  { id: 10765, label: "Science-Fiction & Fantastique" },
  { id: 10766, label: "Soap" },
];

export const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popularité" },
  { value: "vote_average.desc", label: "Mieux notés" },
  { value: "release_date.desc", label: "Plus récents" },
] as const;

export const DISCOVER_TYPES = [
  { value: "movie", label: "Films" },
  { value: "serie", label: "Séries" },
  { value: "anime", label: "Animes" },
] as const;
