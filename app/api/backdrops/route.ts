import { NextResponse } from "next/server";

const BLOCKED_TV_IDS = new Set<number>([
  45950, // High School DxD
  96444, // Interspecies Reviewers
  34742, // To LOVE-Ru
  46414, // Kanokon
]);

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API TMDB manquante." },
      { status: 500 }
    );
  }

  const urls = {
    // Top 20 → 1 page (20 résultats max par page TMDB)
    films: [1].map(
      (page) =>
        `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=fr-FR&page=${page}`
    ),
    // Top 20
    series: [1].map(
      (page) =>
        `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=fr-FR&sort_by=popularity.desc&without_genres=16&vote_count.gte=100&page=${page}`
    ),
    // Top 30 → 2 pages, tronqué ensuite à 30 exactement
    animes: [1, 2].map(
      (page) =>
        `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}` +
        `&with_genres=16&with_origin_country=JP&without_keywords=198385` +
        `&vote_count.gte=100&sort_by=popularity.desc&page=${page}`
    ),
  };

  try {
    const [filmsData, seriesData, animesData] = await Promise.all([
      Promise.all(
        urls.films.map((url) =>
          fetch(url, { next: { revalidate: 3600 } }).then((res) => res.json())
        )
      ),
      Promise.all(
        urls.series.map((url) =>
          fetch(url, { next: { revalidate: 3600 } }).then((res) => res.json())
        )
      ),
      Promise.all(
        urls.animes.map((url) =>
          fetch(url, { next: { revalidate: 3600 } }).then((res) => res.json())
        )
      ),
    ]);

    const films = filmsData.flatMap((r) => r.results || []).slice(0, 20);
    const series = seriesData.flatMap((r) => r.results || []).slice(0, 20);
    const animes = animesData.flatMap((r) => r.results || []).slice(0, 30);

    const allResults = [...films, ...series, ...animes];

    const backdrops = allResults
      .filter(
        (item: { backdrop_path: string | null; id: number }) =>
          item.backdrop_path && !BLOCKED_TV_IDS.has(item.id)
      )
      .map((item: { backdrop_path: string }) => item.backdrop_path);

    return NextResponse.json({ backdrops });
  } catch (error) {
    console.error("Erreur TMDB:", error);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}