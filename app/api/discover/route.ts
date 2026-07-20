import { NextRequest, NextResponse } from "next/server";

const BLOCKED_TV_IDS = new Set<number>([
  45950, // High School DxD
  96444, // Interspecies Reviewers
  34742, // To LOVE-Ru
  46414, // Kanokon
]);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type") || "movie";
  const genres = params.get("genres") || "";
  const sortBy = params.get("sort_by") || "popularity.desc";

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API TMDB manquante." },
      { status: 500 }
    );
  }

  const sortParam =
    type === "movie" && sortBy === "release_date.desc"
      ? "primary_release_date.desc"
      : type !== "movie" && sortBy === "release_date.desc"
      ? "first_air_date.desc"
      : sortBy;

  function buildUrl(page: number) {
    if (type === "movie") {
      return (
        `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}` +
        `&language=fr-FR&sort_by=${sortParam}&vote_count.gte=50&page=${page}` +
        (genres ? `&with_genres=${genres}` : "")
      );
    } else if (type === "serie") {
      return (
        `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}` +
        `&language=fr-FR&sort_by=${sortParam}&vote_count.gte=50` +
        `&without_genres=16&page=${page}` +
        (genres ? `&with_genres=${genres}` : "")
      );
    } else {
      const animeGenres = genres ? `16,${genres}` : "16";
      return (
        `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}` +
        `&language=fr-FR&sort_by=${sortParam}&with_origin_country=JP` +
        `&without_keywords=198385&vote_count.gte=100&page=${page}` +
        `&with_genres=${animeGenres}`
      );
    }
  }

  try {
    const [page1, page2] = await Promise.all(
      [1, 2].map((page) =>
        fetch(buildUrl(page), { next: { revalidate: 1800 } }).then((res) =>
          res.json()
        )
      )
    );

    const mediaType = type === "movie" ? "movie" : "tv";
    const rawResults = [...(page1.results || []), ...(page2.results || [])];

    const results = rawResults
      .filter(
        (item: { id: number; poster_path: string | null }) =>
          item.poster_path &&
          (mediaType === "movie" || !BLOCKED_TV_IDS.has(item.id))
      )
      .slice(0, 20)
      .map(
        (item: {
          id: number;
          title?: string;
          name?: string;
          poster_path: string | null;
          release_date?: string;
          first_air_date?: string;
          vote_average?: number;
        }) => ({
          id: item.id,
          media_type: mediaType,
          title: item.title || item.name,
          poster_path: item.poster_path,
          date: item.release_date || item.first_air_date,
          vote_average: item.vote_average || 0,
        })
      );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Erreur TMDB:", error);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}