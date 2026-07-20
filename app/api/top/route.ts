import { NextRequest, NextResponse } from "next/server";
import { getTopItems } from "@/lib/topItems";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") as
    | "films"
    | "series"
    | "animes"
    | null;

  if (!category || !["films", "series", "animes"].includes(category)) {
    return NextResponse.json({ error: "Catégorie invalide." }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API TMDB manquante." },
      { status: 500 }
    );
  }

  const items = await getTopItems(category, apiKey);
  return NextResponse.json({ items });
}