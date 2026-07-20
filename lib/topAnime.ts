export async function getTopAnimeIds(apiKey: string): Promise<Set<number>> {
  function buildUrl(page: number) {
    return (
      `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}` +
      `&with_genres=16` +
      `&with_origin_country=JP` +
      `&vote_count.gte=100` +
      `&sort_by=popularity.desc` +
      `&page=${page}`
    );
  }

  // 3 pages de 20 résultats = jusqu'à 60, on garde les 50 premiers
  const pages = await Promise.all(
    [1, 2, 3].map((page) =>
      fetch(buildUrl(page), { next: { revalidate: 3600 } }).then((res) =>
        res.json()
      )
    )
  );

  const allIds: number[] = pages.flatMap((p) =>
    (p.results || []).map((s: { id: number }) => s.id)
  );

  return new Set(allIds.slice(0, 50));
}