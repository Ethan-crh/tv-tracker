import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API TMDB manquante." },
      { status: 500 }
    );
  }

  const url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&language=fr-FR&region=FR&page=1`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const movies = (data.results || [])
      .filter((m: { release_date: string }) => {
        if (!m.release_date) return false;
        const releaseDate = new Date(m.release_date);
        return releaseDate >= today; // exclut les dates déjà passées (ressorties de vieux films)
      })
      .sort(
        (a: { release_date: string }, b: { release_date: string }) =>
          new Date(a.release_date).getTime() -
          new Date(b.release_date).getTime()
      )
      .slice(0, 20)
      .map(
        (m: {
          id: number;
          title: string;
          poster_path: string | null;
          release_date: string;
        }) => ({
          id: m.id,
          title: m.title,
          poster_path: m.poster_path,
          release_date: m.release_date,
        })
      );

    return NextResponse.json({ movies });
  } catch (error) {
    console.error("Erreur TMDB:", error);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}