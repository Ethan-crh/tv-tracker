import { NextRequest, NextResponse } from "next/server";
import Fuse from "fuse.js";
import { apiError, badRequest } from "@/lib/api";
import { getPopularTitleNames, searchTitles } from "@/lib/tmdb";

/** Abréviations courantes → titre complet. */
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
  db: "Dragon Ball",
  dbz: "Dragon Ball Z",
  opm: "One Punch Man",
  tokrev: "Tokyo Revengers",
  sao: "Sword Art Online",
};

const MAX_QUERY_LENGTH = 100;

export async function GET(request: NextRequest) {
  const rawQuery = (request.nextUrl.searchParams.get("query") || "").trim();

  if (!rawQuery) return badRequest("Le paramètre 'query' est requis.");
  if (rawQuery.length > MAX_QUERY_LENGTH) return badRequest("Recherche trop longue.");

  const query = ALIASES[rawQuery.toLowerCase()] || rawQuery;

  try {
    let results = await searchTitles(query);
    let correctedTo: string | null = null;

    // Aucun résultat : on tente de corriger une faute de frappe à partir
    // des titres populaires du moment.
    if (results.length === 0) {
      const names = await getPopularTitleNames();
      const match = new Fuse(names, { threshold: 0.4 }).search(rawQuery)[0];
      if (match) {
        correctedTo = match.item;
        results = await searchTitles(correctedTo);
      }
    }

    return NextResponse.json({ results, correctedTo });
  } catch (error) {
    return apiError(error);
  }
}
