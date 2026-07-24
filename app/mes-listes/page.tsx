"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Status = "a_voir" | "en_cours" | "termine" | "abandonne";

const STATUS_LABELS: Record<Status, string> = {
  a_voir: "À voir",
  en_cours: "En cours",
  termine: "Terminé",
  abandonne: "Abandonné",
};

type UserShowRow = {
  tmdb_id: number;
  media_type: "tv" | "movie";
  status: Status;
};

type EnrichedShow = UserShowRow & {
  title: string;
  poster_path: string | null;
  watchedCount: number;
  totalCount: number;
};

export default function MesListesPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [shows, setShows] = useState<EnrichedShow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Récupérer les shows/films suivis
      const { data: userShows } = await supabase
        .from("user_shows")
        .select("tmdb_id, media_type, status")
        .eq("user_id", user.id);

      if (!userShows) {
        setLoading(false);
        return;
      }

      // 2. Récupérer tous les épisodes vus (une seule requête)
      const { data: watched } = await supabase
        .from("watched_episodes")
        .select("tmdb_id")
        .eq("user_id", user.id);

      const watchedCountByShow = new Map<number, number>();
      (watched || []).forEach((w) => {
        watchedCountByShow.set(
          w.tmdb_id,
          (watchedCountByShow.get(w.tmdb_id) || 0) + 1,
        );
      });

      // 3. Enrichir chaque show avec titre, affiche, nb total d'épisodes (via TMDB)
      const enriched: EnrichedShow[] = await Promise.all(
        userShows.map(async (show) => {
          const endpoint =
            show.media_type === "tv"
              ? `/api/tv/${show.tmdb_id}`
              : `/api/movie/${show.tmdb_id}`;
          const res = await fetch(endpoint);
          const data = await res.json();

          const title = data.name || data.title || "Titre inconnu";
          const totalCount =
            show.media_type === "tv" ? data.number_of_episodes || 0 : 1;
          const watchedCount =
            show.media_type === "tv"
              ? watchedCountByShow.get(show.tmdb_id) || 0
              : show.status === "termine"
                ? 1
                : 0;

          return {
            ...show,
            title,
            poster_path: data.poster_path,
            watchedCount,
            totalCount,
          };
        }),
      );

      setShows(enriched);
      setLoading(false);
    }

    load();
  }, [supabase]);

  if (loading) return <p className="p-8">Chargement...</p>;

  if (!user) {
    return (
      <main className="p-8 text-center">
        <p>Connecte-toi pour voir tes listes.</p>
        <Link href="/login" className="text-blue-600 underline">
          Se connecter
        </Link>
      </main>
    );
  }

  const statusOrder: Status[] = ["en_cours", "a_voir", "termine", "abandonne"];

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Mes listes</h1>

      {shows.length === 0 && (
        <p className="text-gray-500">
          Aucun titre ajouté pour l&apos;instant.{" "}
          <Link href="/recherche" className="text-blue-600 underline">
            Rechercher un titre
          </Link>
        </p>
      )}

      {statusOrder.map((status) => {
        const filtered = shows.filter((s) => s.status === status);
        if (filtered.length === 0) return null;

        return (
          <section key={status} className="mb-8">
            <h2 className="text-lg font-semibold mb-3">
              {STATUS_LABELS[status]} ({filtered.length})
            </h2>
            <div className="flex flex-col gap-3">
              {filtered.map((show) => {
                const cappedWatchedCount = Math.min(
                  show.watchedCount,
                  show.totalCount,
                );
                const percent =
                  show.totalCount > 0
                    ? Math.round((cappedWatchedCount / show.totalCount) * 100)
                    : 0;

                return (
                  <Link
                    key={`${show.media_type}-${show.tmdb_id}`}
                    href={
                      show.media_type === "tv"
                        ? `/serie/${show.tmdb_id}`
                        : `/film/${show.tmdb_id}`
                    }
                    className="flex gap-4 border rounded-lg p-3 hover:bg-gray-50 transition items-center"
                  >
                    {show.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${show.poster_path}`}
                        alt={show.title}
                        width={60}
                        height={90}
                        className="rounded"
                      />
                    ) : (
                      <div className="w-[60px] h-[90px] bg-gray-200 rounded" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{show.title}</p>
                      {show.media_type === "tv" && (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {cappedWatchedCount} / {show.totalCount} épisodes (
                            {percent}%)
                          </p>
                        </>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
