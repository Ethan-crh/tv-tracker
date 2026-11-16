import { NextResponse } from "next/server";
import { TmdbError } from "@/lib/tmdb";

/** Traduit une erreur serveur en réponse JSON propre, sans fuite de détails. */
export function apiError(error: unknown, notFoundMessage = "Introuvable.") {
  if (error instanceof TmdbError && error.status === 404) {
    return NextResponse.json({ error: notFoundMessage }, { status: 404 });
  }
  console.error("[api]", error);
  return NextResponse.json(
    { error: "Le service est momentanément indisponible." },
    { status: 502 },
  );
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
