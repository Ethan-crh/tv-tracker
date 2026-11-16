import { NextRequest, NextResponse } from "next/server";
import { apiError, badRequest } from "@/lib/api";
import { discoverTitles, type DiscoverSort, type DiscoverType } from "@/lib/tmdb";

const TYPES: DiscoverType[] = ["movie", "serie", "anime"];
const SORTS: DiscoverSort[] = [
  "popularity.desc",
  "vote_average.desc",
  "release_date.desc",
];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = (params.get("type") || "movie") as DiscoverType;
  const sort = (params.get("sort_by") || "popularity.desc") as DiscoverSort;
  const genresParam = params.get("genres") || "";

  // Les paramètres sont réinjectés dans une URL TMDB : on n'accepte que des
  // valeurs connues.
  if (!TYPES.includes(type)) return badRequest("Type invalide.");
  if (!SORTS.includes(sort)) return badRequest("Tri invalide.");
  if (genresParam && !/^\d{1,6}(,\d{1,6}){0,19}$/.test(genresParam)) {
    return badRequest("Genres invalides.");
  }

  const genres = genresParam ? genresParam.split(",").map(Number) : [];

  try {
    const results = await discoverTitles(type, genres, sort);
    return NextResponse.json({ results });
  } catch (error) {
    return apiError(error);
  }
}
