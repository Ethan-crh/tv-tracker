import { NextRequest, NextResponse } from "next/server";
import { apiError, badRequest } from "@/lib/api";
import { getSeasonEpisodes, parseId } from "@/lib/tmdb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; season_number: string }> },
) {
  const { id, season_number } = await params;
  const showId = parseId(id);

  if (showId === null || !/^\d{1,4}$/.test(season_number)) {
    return badRequest("Identifiant invalide.");
  }

  try {
    const episodes = await getSeasonEpisodes(showId, Number(season_number));
    return NextResponse.json({ episodes });
  } catch (error) {
    return apiError(error, "Saison introuvable.");
  }
}
