type TMDBRawItem = {
  id: number;
  title?: string;
  name?: string;
  media_type?: "movie" | "tv" | "person";
};

export type PopularTitle = {
  id: number;
  title: string;
  media_type: "movie" | "tv";
};

export async function getPopularTitles(
  apiKey: string
): Promise<PopularTitle[]> {
  const endpoints = [
    `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&language=fr-FR`,
    `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=fr-FR`,
    `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=fr-FR`,
    `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=16&with_origin_country=JP&sort_by=popularity.desc&vote_count.gte=50`,
  ];

  const responses = await Promise.all(
    endpoints.map((url) =>
      fetch(url, { next: { revalidate: 21600 } }) // cache 6h
        .then((res) => res.json())
        .catch(() => ({ results: [] }))
    )
  );

  const all: TMDBRawItem[] = responses.flatMap((r) => r.results || []);

  const titles: PopularTitle[] = all
    .filter((item) => item.media_type !== "person")
    .map((item) => ({
      id: item.id,
      title: (item.title || item.name) as string,
      media_type: (item.media_type || (item.title ? "movie" : "tv")) as
        | "movie"
        | "tv",
    }))
    .filter((t) => Boolean(t.title));

  // Dédoublonnage (un même titre peut apparaître dans plusieurs listes)
  const seen = new Set<string>();
  return titles.filter((t) => {
    const key = `${t.media_type}-${t.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}