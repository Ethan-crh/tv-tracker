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
    <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-10">
      <CalendarColumn title="Mes séries en cours" eyebrow="Prochains épisodes">
        {authLoading || (userId && shows.phase === "loading") ? (
          <TimelineSkeleton />
        ) : !userId ? (
          <Note>
            <Link href="/login" className="link font-medium">
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
      <h2 className="section-title mb-6 text-[24px] sm:text-[28px]">{title}</h2>
      {children}
    </section>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="card p-5 text-[15px] leading-relaxed text-muted">{children}</p>;
}

function TimelineSkeleton() {
  return (
    <div className="card overflow-hidden">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-hairline p-4 last:border-b-0">
          <Skeleton className="h-14 w-14 !rounded-xl" />
          <Skeleton className="h-[60px] w-10 !rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        </div>
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
          <h3 className="mb-2.5 px-1 text-[13px] font-semibold text-muted">
            {month.label}
          </h3>
          <Stagger className="card overflow-hidden">
            {month.items.map((item) => (
              <StaggerItem key={item.key} className="border-b border-hairline last:border-b-0">
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
  const weekday = date
    .toLocaleDateString("fr-FR", { weekday: "short" })
    .replace(".", "");

  return (
    <Link
      href={mediaHref(item)}
      className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-black/[0.025]"
    >
      {/* Icône façon app Calendrier */}
      <div className="flex h-14 w-14 shrink-0 flex-col items-center rounded-xl bg-card pt-1.5 shadow-[0_1px_4px_rgb(0_0_0/0.14)] ring-1 ring-black/[0.04]">
        <span className="text-[10px] font-semibold uppercase leading-none text-[#ff3b30]">
          {weekday}
        </span>
        <span className="mt-0.5 text-[27px] font-light leading-none tracking-tight tabular-nums">
          {date.getDate()}
        </span>
      </div>

      <Poster
        path={item.poster_path}
        alt={item.title}
        sizes="40px"
        className="w-10 shrink-0 !rounded-md"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold tracking-[-0.01em]">{item.title}</p>
        {item.detail && (
          <p className="truncate text-[14px] text-ink-soft">{item.detail}</p>
        )}
        <p className="mt-0.5 text-[13px] text-muted">{formatLongDay(item.date)}</p>
      </div>

      {relative && (
        <span
          className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium sm:block ${
            soon ? "bg-accent text-white" : "bg-black/[0.05] text-ink-soft"
          }`}
        >
          {relative}
        </span>
      )}
    </Link>
  );
}
