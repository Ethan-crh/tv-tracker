import { NextRequest, NextResponse } from "next/server";
import { badRequest } from "@/lib/api";
import { getTitleSummary } from "@/lib/tmdb";
import type { MediaType, TitleSummary } from "@/lib/types";

const MAX_ITEMS = 50;

/**
 * Résumés de plusieurs titres en une seule requête :
 *   /api/titles?items=tv:1399,movie:603
 * Les titres introuvables (supprimés de TMDB) sont simplement absents de la
 * réponse.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("items") || "";
  if (!/^(tv|movie):\d{1,9}(,(tv|movie):\d{1,9})*$/.test(raw)) {
    return badRequest("Paramètre 'items' invalide.");
  }

  const items = Array.from(new Set(raw.split(",")));
  if (items.length > MAX_ITEMS) {
    return badRequest(`Maximum ${MAX_ITEMS} titres par requête.`);
  }

  const settled = await Promise.allSettled(
    items.map((item) => {
      const [mediaType, id] = item.split(":");
      return getTitleSummary(mediaType as MediaType, Number(id));
    }),
  );

  const titles: TitleSummary[] = [];
  let failures = 0;
  for (const result of settled) {
    if (result.status === "fulfilled") titles.push(result.value);
    else failures++;
  }

  // Si tout a échoué, c'est TMDB (ou la clé) qui pose problème, pas les titres.
  if (titles.length === 0 && failures > 0) {
    console.error("[api/titles]", (settled[0] as PromiseRejectedResult).reason);
    return NextResponse.json(
      { error: "Le service est momentanément indisponible." },
      { status: 502 },
    );
  }

  return NextResponse.json({ titles });
}
