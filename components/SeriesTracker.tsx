"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/components/AuthProvider";
import { CheckIcon, ResetIcon } from "@/components/Icons";
import ProgressBar from "@/components/ProgressBar";
import Skeleton from "@/components/Skeleton";
import StatusPicker from "@/components/StatusPicker";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/useConfirm";
import { formatRuntime, formatShortDay } from "@/lib/dates";
import { tmdbImage } from "@/lib/images";
import { episodeKey, fetchWatchedEpisodes } from "@/lib/library";
import { STATUS_LABELS, type Episode, type Season, type Status } from "@/lib/types";
import { useToday } from "@/lib/useToday";

const CHUNK_SIZE = 400;
const SAVE_ERROR = "Impossible d'enregistrer. Réessaie.";

type EpisodeRef = { season: number; episode: number };

type SeriesState = {
  seasons: Season[];
  signedIn: boolean;
  authLoading: boolean;
  /** Vrai une fois le statut et les épisodes vus chargés. */
  ready: boolean;
  busy: boolean;
  status: Status | null;
  watched: Set<string>;
  watchedBySeason: Map<number, number>;
  changeStatus: (status: Status) => void;
  loadSeason: (season: number, signal?: AbortSignal) => Promise<Episode[]>;
  toggleEpisode: (season: number, episode: number, episodes: Episode[]) => void;
  markThroughSeason: (season: number) => void;
  unmarkFromSeason: (season: number) => void;
  resetAll: () => void;
};

const SeriesContext = createContext<SeriesState | null>(null);

function useSeries(): SeriesState {
  const ctx = useContext(SeriesContext);
  if (!ctx) throw new Error("Composant utilisé hors de <SeriesProvider>.");
  return ctx;
}

/**
 * État de suivi d'une série (statut + épisodes vus), partagé entre l'en-tête
 * de la fiche et la liste des épisodes.
 */
export function SeriesProvider({
  showId,
  seasons,
  children,
}: {
  showId: number;
  seasons: Season[];
  children: ReactNode;
}) {
  const { supabase, user, loading: authLoading } = useAuth();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [status, setStatus] = useState<Status | null>(null);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  // Une saison déjà chargée n'est jamais redemandée.
  const seasonCache = useRef(new Map<number, Episode[]>());

  const loadSeason = useCallback(
    async (season: number, signal?: AbortSignal) => {
      const cached = seasonCache.current.get(season);
      if (cached) return cached;

      const res = await fetch(`/api/tv/${showId}/season/${season}`, { signal });
      if (!res.ok) throw new Error(`Saison ${season} indisponible.`);
      const data: { episodes: Episode[] } = await res.json();
      seasonCache.current.set(season, data.episodes);
      return data.episodes;
    },
    [showId],
  );

  const userId = user?.id;

  const reloadWatched = useCallback(async () => {
    if (!userId) return;
    try {
      setWatched(await fetchWatchedEpisodes(supabase, userId, showId));
    } catch (error) {
      console.error("Lecture des épisodes vus impossible :", error);
    }
  }, [supabase, userId, showId]);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    Promise.all([
      supabase
        .from("user_shows")
        .select("status")
        .eq("user_id", userId)
        .eq("tmdb_id", showId)
        .eq("media_type", "tv")
        .maybeSingle(),
      fetchWatchedEpisodes(supabase, userId, showId),
    ])
      .then(([statusRow, watchedSet]) => {
        if (!active) return;
        setStatus((statusRow.data?.status as Status) ?? null);
        setWatched(watchedSet);
      })
      .catch((error) => {
        console.error("Chargement du suivi impossible :", error);
        if (active) toast.error("Impossible de charger ta progression.");
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [supabase, userId, showId, toast]);

  const watchedBySeason = useMemo(() => {
    const counts = new Map<number, number>();
    for (const key of watched) {
      const season = Number(key.split("-")[0]);
      counts.set(season, (counts.get(season) || 0) + 1);
    }
    return counts;
  }, [watched]);

  // --- Écritures -----------------------------------------------------------

  const saveStatus = useCallback(
    async (next: Status | null): Promise<boolean> => {
      if (!userId) return false;
      const { error } =
        next === null
          ? await supabase
              .from("user_shows")
              .delete()
              .eq("user_id", userId)
              .eq("tmdb_id", showId)
              .eq("media_type", "tv")
          : await supabase.from("user_shows").upsert(
              { user_id: userId, tmdb_id: showId, media_type: "tv", status: next },
              { onConflict: "user_id,tmdb_id,media_type" },
            );
      if (error) console.error("Enregistrement du statut impossible :", error);
      return !error;
    },
    [supabase, userId, showId],
  );

  /** Coche une liste d'épisodes (optimiste, annulé si l'écriture échoue). */
  const markEpisodes = useCallback(
    async (refs: EpisodeRef[]): Promise<boolean> => {
      if (!userId || refs.length === 0) return true;

      setWatched((prev) => {
        const next = new Set(prev);
        for (const r of refs) next.add(episodeKey(r.season, r.episode));
        return next;
      });

      const rows = refs.map((r) => ({
        user_id: userId,
        tmdb_id: showId,
        season_number: r.season,
        episode_number: r.episode,
      }));
      const chunks: (typeof rows)[] = [];
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        chunks.push(rows.slice(i, i + CHUNK_SIZE));
      }

      const results = await Promise.all(
        chunks.map((chunk) =>
          supabase.from("watched_episodes").upsert(chunk, {
            onConflict: "user_id,tmdb_id,season_number,episode_number",
            ignoreDuplicates: true,
          }),
        ),
      );

      const failed = results.find((r) => r.error);
      if (failed) {
        console.error("Enregistrement des épisodes impossible :", failed.error);
        await reloadWatched();
        return false;
      }
      return true;
    },
    [supabase, userId, showId, reloadWatched],
  );

  /** Tous les épisodes des saisons régulières jusqu'à `maxSeason` incluse. */
  const collectEpisodes = useCallback(
    async (maxSeason: number): Promise<EpisodeRef[]> => {
      const targets = seasons.filter(
        (s) => s.season_number > 0 && s.season_number <= maxSeason,
      );
      const lists = await Promise.all(
        targets.map(async (s) =>
          (await loadSeason(s.season_number)).map((ep) => ({
            season: s.season_number,
            episode: ep.episode_number,
          })),
        ),
      );
      return lists.flat();
    },
    [seasons, loadSeason],
  );

  /** Une série dont on coche un épisode rejoint « En cours » si elle n'est pas suivie. */
  const ensureTracked = useCallback(async () => {
    if (status !== null) return;
    if (await saveStatus("en_cours")) {
      setStatus("en_cours");
      toast.success("Série ajoutée à « En cours »");
    }
  }, [status, saveStatus, toast]);

  const runBusy = useCallback(
    async (task: () => Promise<void>): Promise<boolean> => {
      setBusy(true);
      try {
        await task();
        return true;
      } catch (error) {
        console.error(error);
        toast.error(SAVE_ERROR);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );

  const changeStatus = useCallback(
    async (next: Status) => {
      if (!userId || busy) return;
      const previous = status;

      if (previous === next) {
        setStatus(null);
        if (await saveStatus(null)) {
          toast.success("Retirée de tes listes");
        } else {
          setStatus(previous);
          toast.error(SAVE_ERROR);
        }
        return;
      }

      if (next === "termine") {
        const answer = await confirm({
          title: "Marquer comme terminée",
          message:
            "Tous les épisodes de toutes les saisons seront cochés comme vus. Tu peux aussi changer le statut sans toucher aux épisodes.",
          confirmLabel: "Tout cocher",
          alternativeLabel: "Statut seul",
        });
        if (answer === "cancel") return;

        if (answer === "confirm") {
          const marked = await runBusy(async () => {
            const refs = await collectEpisodes(Infinity);
            if (!(await markEpisodes(refs))) throw new Error("upsert");
          });
          // Si les épisodes n'ont pas pu être cochés, on ne change pas le statut.
          if (!marked) return;
        }
      }

      setStatus(next);
      if (await saveStatus(next)) {
        toast.success(`Statut : ${STATUS_LABELS[next]}`);
      } else {
        setStatus(previous);
        toast.error(SAVE_ERROR);
      }
    },
    [userId, busy, status, saveStatus, toast, confirm, runBusy, collectEpisodes, markEpisodes],
  );

  const toggleEpisode = useCallback(
    async (season: number, episode: number, episodes: Episode[]) => {
      if (!userId || busy) return;
      const key = episodeKey(season, episode);

      // Décocher : immédiat.
      if (watched.has(key)) {
        setWatched((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        const { error } = await supabase
          .from("watched_episodes")
          .delete()
          .eq("user_id", userId)
          .eq("tmdb_id", showId)
          .eq("season_number", season)
          .eq("episode_number", episode);
        if (error) {
          console.error("Suppression de l'épisode impossible :", error);
          await reloadWatched();
          toast.error(SAVE_ERROR);
        }
        return;
      }

      // Cocher : s'il reste des épisodes précédents non vus dans la saison,
      // on propose de les rattraper d'un coup.
      const earlier = episodes.filter(
        (ep) =>
          ep.episode_number < episode &&
          !watched.has(episodeKey(season, ep.episode_number)),
      );

      let refs: EpisodeRef[] = [{ season, episode }];
      if (earlier.length > 0) {
        const answer = await confirm({
          title: "Rattraper les épisodes précédents ?",
          message: `${earlier.length} épisode${earlier.length > 1 ? "s" : ""} avant celui-ci ${earlier.length > 1 ? "ne sont pas cochés" : "n'est pas coché"} dans cette saison.`,
          confirmLabel: `Tout cocher (${earlier.length + 1})`,
          alternativeLabel: "Seulement celui-ci",
        });
        if (answer === "cancel") return;
        if (answer === "confirm") {
          refs = [
            ...earlier.map((ep) => ({ season, episode: ep.episode_number })),
            { season, episode },
          ];
        }
      }

      if (await markEpisodes(refs)) {
        await ensureTracked();
      } else {
        toast.error(SAVE_ERROR);
      }
    },
    [userId, busy, watched, supabase, showId, reloadWatched, toast, confirm, markEpisodes, ensureTracked],
  );

  const markThroughSeason = useCallback(
    async (season: number) => {
      if (!userId || busy) return;
      const answer = await confirm({
        title: "Tout marquer comme vu",
        message:
          season > 1
            ? `Tous les épisodes des saisons 1 à ${season} seront cochés.`
            : "Tous les épisodes de la saison 1 seront cochés.",
        confirmLabel: "Tout cocher",
      });
      if (answer !== "confirm") return;

      await runBusy(async () => {
        const refs = await collectEpisodes(season);
        if (!(await markEpisodes(refs))) throw new Error("upsert");
        await ensureTracked();
        toast.success(`${refs.length} épisodes cochés`);
      });
    },
    [userId, busy, confirm, runBusy, collectEpisodes, markEpisodes, ensureTracked, toast],
  );

  const deleteWatched = useCallback(
    async (fromSeason: number | null) => {
      if (!userId) return;
      let query = supabase
        .from("watched_episodes")
        .delete()
        .eq("user_id", userId)
        .eq("tmdb_id", showId);
      if (fromSeason !== null) query = query.gte("season_number", fromSeason);

      const { error } = await query;
      await reloadWatched();
      if (error) throw error;
    },
    [supabase, userId, showId, reloadWatched],
  );

  const unmarkFromSeason = useCallback(
    async (season: number) => {
      if (!userId || busy) return;
      const answer = await confirm({
        title: "Tout décocher",
        message: `Tous les épisodes de la saison ${season} et des saisons suivantes seront décochés.`,
        confirmLabel: "Décocher",
        danger: true,
      });
      if (answer !== "confirm") return;

      await runBusy(async () => {
        await deleteWatched(season);
        toast.success("Épisodes décochés");
      });
    },
    [userId, busy, confirm, runBusy, deleteWatched, toast],
  );

  const resetAll = useCallback(async () => {
    if (!userId || busy) return;
    const answer = await confirm({
      title: "Réinitialiser la progression",
      message:
        "Tout l'historique d'épisodes vus de cette série sera supprimé, épisodes spéciaux compris. Cette action est irréversible.",
      confirmLabel: "Tout réinitialiser",
      danger: true,
    });
    if (answer !== "confirm") return;

    await runBusy(async () => {
      await deleteWatched(null);
      toast.success("Progression réinitialisée");
    });
  }, [userId, busy, confirm, runBusy, deleteWatched, toast]);

  const signedIn = Boolean(user);
  const value = useMemo<SeriesState>(
    () => ({
      seasons,
      signedIn,
      authLoading,
      ready: signedIn ? ready : !authLoading,
      busy,
      // Après une déconnexion, on n'affiche plus les données de l'ancien compte.
      status: signedIn ? status : null,
      watched: signedIn ? watched : EMPTY_SET,
      watchedBySeason: signedIn ? watchedBySeason : EMPTY_MAP,
      changeStatus,
      loadSeason,
      toggleEpisode,
      markThroughSeason,
      unmarkFromSeason,
      resetAll,
    }),
    [seasons, signedIn, authLoading, ready, busy, status, watched, watchedBySeason, changeStatus, loadSeason, toggleEpisode, markThroughSeason, unmarkFromSeason, resetAll],
  );

  return (
    <SeriesContext.Provider value={value}>
      {children}
      {dialog}
    </SeriesContext.Provider>
  );
}

const EMPTY_SET = new Set<string>();
const EMPTY_MAP = new Map<number, number>();

// ---------------------------------------------------------------------------
// En-tête : statut + progression globale
// ---------------------------------------------------------------------------

export function SeriesStatus() {
  const { signedIn, authLoading, ready, busy, status, changeStatus, seasons, watchedBySeason } =
    useSeries();

  if (authLoading) return <div className="h-[62px]" />;

  if (!signedIn) {
    return (
      <p className="text-[15px] text-white/70">
        <Link href="/login" className="text-link-dark hover:underline">
          Connecte-toi
        </Link>{" "}
        pour suivre cette série et cocher tes épisodes.
      </p>
    );
  }

  const regular = seasons.filter((s) => s.season_number > 0);
  const total = regular.reduce((sum, s) => sum + s.episode_count, 0);
  const seen = regular.reduce(
    (sum, s) =>
      sum + Math.min(watchedBySeason.get(s.season_number) || 0, s.episode_count),
    0,
  );
  const percent = total > 0 ? (seen / total) * 100 : 0;

  return (
    <>
      <StatusPicker value={status} onChange={changeStatus} disabled={!ready || busy} />
      {total > 0 && (
        <div className="max-w-md">
          <div className="mb-2 flex items-baseline justify-between text-[13px] text-white/60">
            <span className="font-medium">Progression</span>
            <span className="tabular-nums">
              <span className="font-semibold text-white">{seen}</span> sur {total}{" "}
              épisodes · {Math.round(percent)} %
            </span>
          </div>
          <ProgressBar percent={percent} label="Progression dans la série" tone="dark" />
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Saisons & épisodes
// ---------------------------------------------------------------------------

export function SeasonTracker() {
  const series = useSeries();
  const { seasons, signedIn, ready, busy, watched, watchedBySeason } = series;
  const today = useToday();

  const [picked, setPicked] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<{
    season: number;
    episodes: Episode[];
    failed: boolean;
  } | null>(null);

  // Par défaut : la première saison régulière pas encore terminée.
  const suggested = useMemo(() => {
    const regular = seasons.filter((s) => s.season_number > 0);
    const unfinished = regular.find(
      (s) => (watchedBySeason.get(s.season_number) || 0) < s.episode_count,
    );
    return (unfinished ?? regular[0] ?? seasons[0])?.season_number ?? null;
    // On ne recalcule qu'une fois la progression chargée, pas à chaque coche.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasons, ready]);

  const active = picked ?? suggested;
  const { loadSeason } = series;

  useEffect(() => {
    if (active === null) return;
    const controller = new AbortController();

    loadSeason(active, controller.signal)
      .then((episodes) => setLoaded({ season: active, episodes, failed: false }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setLoaded({ season: active, episodes: [], failed: true });
      });

    return () => controller.abort();
  }, [active, loadSeason]);

  if (seasons.length === 0 || active === null) {
    return (
      <p className="text-[15px] text-muted">
        Aucun épisode n&apos;est encore référencé pour cette série.
      </p>
    );
  }

  const current = loaded?.season === active ? loaded : null;

  return (
    <section>
      <h2 className="section-title mb-5 text-[28px] sm:text-[32px]">Épisodes</h2>

      <div
        role="tablist"
        aria-label="Saisons"
        className="scrollbar-hide -mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6"
      >
        {seasons.map((season) => {
          const selected = active === season.season_number;
          const seen = Math.min(
            watchedBySeason.get(season.season_number) || 0,
            season.episode_count,
          );
          const complete = seen >= season.episode_count;
          return (
            <button
              key={season.id}
              role="tab"
              aria-selected={selected}
              onClick={() => setPicked(season.season_number)}
              className={`relative z-0 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium transition-colors duration-200 ${
                selected ? "text-white" : "text-ink/70 hover:bg-black/5 hover:text-ink"
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="season-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  className="absolute inset-0 -z-10 rounded-full bg-ink"
                />
              )}
              {season.name}
              {signedIn &&
                (complete ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success text-white">
                    <CheckIcon size={10} />
                  </span>
                ) : (
                  <span className="text-[12px] tabular-nums opacity-60">
                    {seen}/{season.episode_count}
                  </span>
                ))}
            </button>
          );
        })}
      </div>

      {signedIn && active > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => series.markThroughSeason(active)}
            disabled={busy || !ready}
            className="btn btn-primary btn-sm"
          >
            <CheckIcon size={13} />
            {active > 1 ? `Tout vu jusqu'à la saison ${active}` : "Saison vue"}
          </button>
          <button
            onClick={() => series.unmarkFromSeason(active)}
            disabled={busy || !ready}
            className="btn btn-sm"
          >
            Décocher à partir d&apos;ici
          </button>
          <button
            onClick={series.resetAll}
            disabled={busy || !ready || watched.size === 0}
            className="btn btn-plain btn-sm !text-danger"
          >
            <ResetIcon size={13} />
            Réinitialiser
          </button>
          {busy && (
            <span role="status" className="text-[13px] text-muted">
              Enregistrement…
            </span>
          )}
        </div>
      )}

      {!current ? (
        <div className="card overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex gap-4 border-b border-hairline p-4 last:border-b-0">
              <Skeleton className="h-7 w-7 !rounded-full" />
              <Skeleton className="hidden aspect-video w-40 sm:block" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-2 h-3 w-1/4" />
                <Skeleton className="mt-3 h-3 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : current.failed ? (
        <p className="card p-5 text-[15px] text-muted">
          Impossible de charger cette saison pour le moment. Réessaie dans un
          instant.
        </p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.ol
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="card overflow-hidden"
          >
            {current.episodes.map((ep, i) => (
              <EpisodeRow
                key={ep.id}
                episode={ep}
                index={i}
                watched={watched.has(episodeKey(active, ep.episode_number))}
                upcoming={Boolean(today && ep.air_date && ep.air_date > today)}
                signedIn={signedIn}
                disabled={!signedIn || !ready || busy}
                onToggle={() =>
                  series.toggleEpisode(active, ep.episode_number, current.episodes)
                }
              />
            ))}
          </motion.ol>
        </AnimatePresence>
      )}
    </section>
  );
}

function EpisodeRow({
  episode,
  index,
  watched,
  upcoming,
  signedIn,
  disabled,
  onToggle,
}: {
  episode: Episode;
  index: number;
  watched: boolean;
  upcoming: boolean;
  signedIn: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const meta = [
    episode.air_date ? formatShortDay(episode.air_date) : null,
    episode.runtime ? formatRuntime(episode.runtime) : null,
  ].filter(Boolean);

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      // Seuls les premiers épisodes arrivent en cascade : au-delà, l'attente
      // serait pénible sur les longues saisons.
      transition={{ duration: 0.4, delay: Math.min(index, 10) * 0.03 }}
      className="flex items-start gap-3.5 border-b border-hairline px-4 py-4 last:border-b-0 sm:gap-5 sm:px-5"
    >
      {/* Coche ronde, façon app Rappels */}
      {signedIn && (
        <motion.button
          role="checkbox"
          aria-checked={watched}
          aria-label={`Épisode ${episode.episode_number} vu`}
          disabled={disabled}
          onClick={onToggle}
          whileTap={disabled ? undefined : { scale: 0.85 }}
          className={`relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
            watched ? "border-accent" : "border-line hover:border-accent/60"
          }`}
        >
          <AnimatePresence initial={false}>
            {watched && (
              <motion.span
                className="absolute inset-[-1.5px] flex items-center justify-center rounded-full bg-accent text-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 22 }}
              >
                <CheckIcon size={15} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}

      {episode.still_path && (
        <div className="relative hidden aspect-video w-40 shrink-0 overflow-hidden rounded-[10px] bg-fill sm:block">
          <Image
            src={tmdbImage(episode.still_path, "still")}
            alt=""
            fill
            sizes="160px"
            className={`object-cover transition-opacity duration-500 ${watched ? "opacity-60" : ""}`}
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold leading-snug tracking-[-0.015em]">
          <span className="mr-1.5 font-normal tabular-nums text-muted">
            {episode.episode_number}.
          </span>
          {episode.name}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted">
          {meta.join(" · ")}
          {upcoming && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
              À venir
            </span>
          )}
        </p>
        {episode.overview && (
          <p className="mt-1.5 line-clamp-3 text-[14px] leading-relaxed text-ink-soft">
            {episode.overview}
          </p>
        )}
      </div>
    </motion.li>
  );
}
