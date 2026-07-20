export type TopItem = {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
};

const BLOCKED_TV_IDS = new Set<number>([
  45950, // High School DxD
  96444, // Interspecies Reviewers
  34742, // To LOVE-Ru
  46414, // Kanokon
]);

// Change cette valeur à 50 si tu veux plus de titres par rail
const ITEMS_PER_ROW = 30;

export async function getTopItems(
  category: "films" | "series" | "animes",
  apiKey: string
): Promise<TopItem[]> {
  function buildUrl(page: number) {
    if (category === "films") {
      return `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=fr-FR&page=${page}`;
    }
    if (category === "series") {
      return `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=fr-FR&sort_by=popularity.desc&without_genres=16&vote_count.gte=100&page=${page}`;
    }
    return `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=fr-FR&with_genres=16&with_origin_country=JP&sort_by=popularity.desc&vote_count.gte=100&page=${page}`;
  }

  // TMDB renvoie 20 résultats par page, donc on en charge plusieurs en parallèle
  const pagesNeeded = Math.ceil(ITEMS_PER_ROW / 20);
  const pages = await Promise.all(
    Array.from({ length: pagesNeeded }, (_, i) => i + 1).map((page) =>
      fetch(buildUrl(page), { next: { revalidate: 3600 } }).then((res) =>
        res.json()
      )
    )
  );

  const mediaType: "movie" | "tv" = category === "films" ? "movie" : "tv";
  const allResults = pages.flatMap((p) => p.results || []);

  return allResults
    .filter((item: { poster_path: string | null }) => item.poster_path)
    .filter((item: { id: number }) =>
      mediaType === "tv" ? !BLOCKED_TV_IDS.has(item.id) : true
    )
    .slice(0, ITEMS_PER_ROW)
    .map(
      (item: {
        id: number;
        title?: string;
        name?: string;
        poster_path: string;
      }) => ({
        id: item.id,
        media_type: mediaType,
        title: (item.title || item.name) as string,
        poster_path: item.poster_path,
      })
    );
}