"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import StatusPicker from "@/components/StatusPicker";
import { useToast } from "@/components/Toast";
import { STATUS_LABELS, type Status } from "@/lib/types";

const MOVIE_LABELS: Record<Status, string> = { ...STATUS_LABELS, termine: "Vu" };
// « En cours » n'a pas de sens pour un film : on ne le propose que s'il est
// déjà enregistré, pour ne pas masquer un statut existant.
const MOVIE_STATUSES: Status[] = ["a_voir", "termine", "abandonne"];

export default function MovieActions({ movieId }: { movieId: number }) {
  const { supabase, user, loading } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;

    supabase
      .from("user_shows")
      .select("status")
      .eq("user_id", user.id)
      .eq("tmdb_id", movieId)
      .eq("media_type", "movie")
      .maybeSingle()
      .then(({ data }) => {
        if (active) setStatus((data?.status as Status) ?? null);
      });

    return () => {
      active = false;
    };
  }, [user, movieId, supabase]);

  async function handleChange(next: Status) {
    if (!user || saving) return;

    const previous = status;
    const removing = previous === next;
    setStatus(removing ? null : next);
    setSaving(true);

    const { error } = removing
      ? await supabase
          .from("user_shows")
          .delete()
          .eq("user_id", user.id)
          .eq("tmdb_id", movieId)
          .eq("media_type", "movie")
      : await supabase.from("user_shows").upsert(
          {
            user_id: user.id,
            tmdb_id: movieId,
            media_type: "movie",
            status: next,
          },
          { onConflict: "user_id,tmdb_id,media_type" },
        );

    setSaving(false);

    if (error) {
      setStatus(previous);
      toast.error("Impossible d'enregistrer. Réessaie.");
    } else {
      toast.success(
        removing ? "Retiré de tes listes" : `Ajouté à « ${MOVIE_LABELS[next]} »`,
      );
    }
  }

  if (loading) return <div className="h-10" />;

  if (!user) {
    return (
      <p className="text-sm text-paper/70">
        <Link href="/login" className="link text-paper">
          Connecte-toi
        </Link>{" "}
        pour suivre ce film.
      </p>
    );
  }

  return (
    <StatusPicker
      value={status}
      onChange={handleChange}
      labels={MOVIE_LABELS}
      statuses={status === "en_cours" ? undefined : MOVIE_STATUSES}
    />
  );
}
