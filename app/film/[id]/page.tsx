"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type MovieDetails = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  runtime: number;
};

type Status = "a_voir" | "en_cours" | "termine" | "abandonne";

const STATUS_LABELS: Record<Status, string> = {
  a_voir: "À voir",
  en_cours: "En cours",
  termine: "Vu",
  abandonne: "Abandonné",
};

export default function FilmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tmdbId = parseInt(id, 10);
  const supabase = createClient();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    async function fetchMovie() {
      setLoading(true);
      const res = await fetch(`/api/movie/${id}`);
      const data = await res.json();
      setMovie(data);
      setLoading(false);
    }
    fetchMovie();
  }, [id]);

  useEffect(() => {
    if (!user) return;

    async function fetchStatus() {
      const { data } = await supabase
        .from("user_shows")
        .select("status")
        .eq("user_id", user!.id)
        .eq("tmdb_id", tmdbId)
        .eq("media_type", "movie")
        .maybeSingle();

      if (data) setStatus(data.status as Status);
    }
    fetchStatus();
  }, [user, tmdbId, supabase]);

  async function handleStatusChange(newStatus: Status) {
    if (!user) return;

    setStatus(newStatus);

    await supabase.from("user_shows").upsert(
      {
        user_id: user.id,
        tmdb_id: tmdbId,
        media_type: "movie",
        status: newStatus,
      },
      { onConflict: "user_id,tmdb_id,media_type" }
    );
  }

  if (loading) return <p className="p-8">Chargement...</p>;
  if (!movie) return <p className="p-8">Film introuvable.</p>;

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex gap-6">
        {movie.poster_path && (
          <Image
            src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
            alt={movie.title}
            width={220}
            height={330}
            className="rounded-lg"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
          <p className="text-sm text-gray-500 mb-4">
            {movie.release_date?.slice(0, 4)}
            {movie.runtime ? ` · ${movie.runtime} min` : ""}
          </p>
          <p className="text-gray-600 mb-4">{movie.overview}</p>

          {user ? (
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    status === s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Connecte-toi pour suivre ce film.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}