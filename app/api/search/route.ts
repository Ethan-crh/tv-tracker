import { NextRequest, NextResponse } from "next/server";
import Fuse from "fuse.js";
import { getPopularTitles } from "@/lib/popularTitles";
import { getTopAnimeIds } from "@/lib/topAnime";

const ALIASES: Record<string, string> = {
  jjk: "Jujutsu Kaisen",
  mha: "My Hero Academia",
  aot: "Attack on Titan",
  snk: "Shingeki no Kyojin",
  op: "One Piece",
  fma: "Fullmetal Alchemist",
  kny: "Kimetsu no Yaiba",
  ds: "Demon Slayer",
  hxh: "Hunter x Hunter",
  swk: "Solo Leveling",
  db: "Dragon Ball",
  dbz: "Dragon Ball Z",
  ow: "One Punch Man",
  opm: "One Punch Man",
  tokrev: "Tokyo Revengers",
  sao: "Sword Art Online",
};

const BLOCKED_TV_IDS = new Set<number>([
  45950, // High School DxD
  96444, // Interspecies Reviewers (Ishuzoku Reviewers)
  34742, // To LOVE-Ru
  46414, // Kanokon
]);

type TMDBResult = {
  id: number;
  media_type: string;
  genre_ids?: number[];
  origin_country?: string[];
  popularity?: number;
};

function isAnime(item: TMDBResult) {
  return (
    item.media_type === "tv" &&
    item.genre_ids?.includes(16) &&
    item.origin_country?.includes("JP")
  );
}

async function searchTMDB(
  query: string,
  apiKey: string,
  topAnimeIds: Set<number>
) {
  const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(
    query
  )}&api_key=${apiKey}&language=fr-FR&include_adult=false`;

  const response = await fetch(url);
  if (!response.ok) return [];

  const data = await response.json();

  const filtered = (data.results || []).filter((item: TMDBResult) => {
    if (item.media_type !== "movie" && item.media_type !== "tv") return false;

    if (item.media_type === "tv" && BLOCKED_TV_IDS.has(item.id)) return false;

    if (isAnime(item)) return topAnimeIds.has(item.id);

    return true;
  });

  // Trie par popularité décroissante : le titre le plus connu apparaît en premier,
  // peu importe l'ordre de pertinence textuelle renvoyé par défaut par TMDB
  return filtered.sort(
    (a: { popularity?: number }, b: { popularity?: number }) =>
      (b.popularity || 0) - (a.popularity || 0)
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawQuery = searchParams.get("query");

  if (!rawQuery) {
    return NextResponse.json(
      { error: "Le paramètre 'query' est requis." },
      { status: 400 }
    );
  }

  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API TMDB manquante côté serveur." },
      { status: 500 }
    );
  }

  const normalized = rawQuery.trim().toLowerCase();
  const query = ALIASES[normalized] || rawQuery;

  try {
    const topAnimeIds = await getTopAnimeIds(apiKey);

    let results = await searchTMDB(query, apiKey, topAnimeIds);
    let correctedTo: string | null = null;

    if (results.length === 0) {
      const popularTitles = await getPopularTitles(apiKey);
      const fuse = new Fuse(popularTitles, {
        keys: ["title"],
        threshold: 0.4,
      });

      const match = fuse.search(rawQuery)[0];

      if (match) {
        correctedTo = match.item.title;
        results = await searchTMDB(correctedTo, apiKey, topAnimeIds);
      }
    }

    return NextResponse.json({ results, correctedTo });
  } catch (error) {
    console.error("Erreur TMDB:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de la recherche." },
      { status: 500 }
    );
  }
}