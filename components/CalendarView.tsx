"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Poster, mediaHref } from "@/components/PosterCard";
import { Stagger, StaggerItem } from "@/components/Reveal";
import Skeleton from "@/components/Skeleton";
import { formatLongDay, formatMonth, parseDay, relativeDay } from "@/lib/dates";
import { fetchTitleSummaries, fetchUserShows } from "@/lib/library";
import type { MediaType, TitleSummary, UpcomingMovie } from "@/lib/types";
import { useToday } from "@/lib/useToday";

type CalendarItem = {
  key: string;
  media_type: MediaType;
  id: number;
  title: string;
  poster_path: string | null;
  date: string;
  detail?: string;
};

type ShowsState =
  | { phase: "loading" }
  | { phase: "error" }
  | { phase: "ready"; items: CalendarItem[] };

function toItem(show: TitleSummary): CalendarItem | null {
  const next = show.next_episode;
  if (!next) return null;
  const code = `S${next.season_number} E${next.episode_number}`;
  return {
    key: `tv-${show.id}`,
    media_type: "tv",
    id: show.id,
    title: show.title,
    poster_path: show.poster_path,
    date: next.air_date,
    detail: next.name ? `${code} · ${next.name}` : code,
  };
}

export default function CalendarView({ movies }: { movies: UpcomingMovie[] }) {
  const { supabase, user, loading: authLoading } = useAuth();
  const today = useToday();
  const [result, setResult] = useState<{ userId: string; state: ShowsState } | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;

    (async () => {
      const shows = (await fetchUserShows(supabase, userId)).filter(
        (s) => s.media_type === "tv" && s.status === "en_cours",
      );
      const summaries = await fetchTitleSummaries(shows);
      return Array.from(summaries.values())
        .map(toItem)
        .filter((item): item is CalendarItem => item !== null);
    })()
      .then((items) => {
        if (active) setResult({ userId, state: { phase: "ready", items } });
      })
      .catch((error) => {
        console.error("Chargement du calendrier impossible :", error);
        if (active) setResult({ userId, state: { phase: "error" } });
      });

    return () => {
      active = false;
    };
  }, [supabase, userId]);

  const shows: ShowsState =
    userId && result?.userId === userId ? result.state : { phase: "loading" };

  // La liste des films est mise en cache côté serveur : on écarte ici ceux
  // qui sont sortis depuis.
  const movieItems: CalendarItem[] = movies
    .filter((m) => !today || m.release_date >= today)
    .slice(0, 24)
    .map((m) => ({
      key: `movie-${m.id}`,
      media_type: "movie",
      id: m.id,
      title: m.title,
      poster_path: m.poster_path,
      date: m.release_date,
    }));

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
      <CalendarColumn title="Mes séries en cours" eyebrow="Prochains épisodes">
        {authLoading || (userId && shows.phase === "loading") ? (
          <TimelineSkeleton />
        ) : !userId ? (
          <Note>
            <Link href="/login" className="link font-bold">
              Connecte-toi
            </Link>{" "}
            pour voir les prochains épisodes des séries que tu suis.
          </Note>
        ) : shows.phase === "error" ? (
          <Note>Impossible de charger tes séries pour le moment.</Note>
        ) : shows.phase === "ready" && shows.items.length === 0 ? (
          <Note>
            Aucun épisode annoncé pour tes séries « En cours ». Passe une série
            en « En cours » depuis sa fiche pour la voir ici.
          </Note>
        ) : (
          shows.phase === "ready" && <Timeline items={shows.items} today={today} />
        )}
      </CalendarColumn>

      <CalendarColumn title="Au cinéma" eyebrow="Prochaines sorties en France">
        {movieItems.length === 0 ? (
          <Note>Aucune sortie annoncée pour le moment.</Note>
        ) : (
          <Timeline items={movieItems} today={today} />
        )}
      </CalendarColumn>
    </div>
  );
}

function CalendarColumn({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section>
      <p className="eyebrow mb-1">{eyebrow}</p>
      <h2 className="mb-6 font-display text-xl sm:text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="panel halftone p-5 text-sm leading-relaxed text-ink-soft">
      {children}
    </p>
  );
}

function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-[92px] w-full" />
      ))}
    </div>
  );
}

function Timeline({ items, today }: { items: CalendarItem[]; today: string | null }) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));

  const months: { label: string; items: CalendarItem[] }[] = [];
  for (const item of sorted) {
    const label = formatMonth(item.date);
    const last = months[months.length - 1];
    if (last?.label === label) last.items.push(item);
    else months.push({ label, items: [item] });
  }

  return (
    <div className="flex flex-col gap-8">
      {months.map((month) => (
        <div key={month.label}>
          <h3 className="mb-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted">
            {month.label}
            <span className="h-px flex-1 bg-ink/15" />
          </h3>
          <Stagger className="flex flex-col gap-3">
            {month.items.map((item) => (
              <StaggerItem key={item.key}>
                <TimelineRow item={item} today={today} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      ))}
    </div>
  );
}

function TimelineRow({ item, today }: { item: CalendarItem; today: string | null }) {
  const date = parseDay(item.date);
  const relative = today ? relativeDay(today, item.date) : null;
  const soon = relative === "Aujourd'hui" || relative === "Demain";

  return (
    <Link
      href={mediaHref(item)}
      className="panel group flex items-center gap-4 p-3 transition-[transform,box-shadow] duration-300 ease-out-expo hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg"
    >
      <div
        className={`flex h-[68px] w-14 shrink-0 flex-col items-center justify-center rounded-[4px] border-2 border-ink ${
          soon ? "bg-accent text-white" : "bg-sun"
        }`}
      >
        <span className="font-display text-2xl leading-none">{date.getDate()}</span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-wider">
          {date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}
        </span>
      </div>

      <Poster path={item.poster_path} alt={item.title} sizes="46px" className="w-[46px] shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold transition-colors group-hover:text-accent">
          {item.title}
        </p>
        {item.detail && (
          <p className="truncate text-sm text-ink-soft">{item.detail}</p>
        )}
        <p className="mt-0.5 font-mono text-[11px] text-muted">
          {formatLongDay(item.date)}
        </p>
      </div>

      {relative && (
        <span
          className={`hidden shrink-0 rounded-full border-2 border-ink px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider sm:block ${
            soon ? "bg-ink text-white" : "bg-card"
          }`}
        >
          {relative}
        </span>
      )}
    </Link>
  );
}
