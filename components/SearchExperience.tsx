"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import EmptyState from "@/components/EmptyState";
import { CloseIcon, FilterIcon, SearchIcon } from "@/components/Icons";
import PosterCard, { mediaHref } from "@/components/PosterCard";
import { Stagger, StaggerItem } from "@/components/Reveal";
import { PosterGridSkeleton } from "@/components/Skeleton";
import {
  DISCOVER_TYPES,
  MOVIE_GENRES,
  SORT_OPTIONS,
  TV_GENRES,
} from "@/lib/genres";
import { tmdbImage } from "@/lib/images";
import { KIND_LABELS, type MediaCard } from "@/lib/types";

type DiscoverType = (typeof DISCOVER_TYPES)[number]["value"];
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

type Loaded = {
  key: string;
  results: MediaCard[];
  correctedTo: string | null;
  error: string | null;
};

const GRID =
  "grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

/**
 * Recherche + filtres. L'état vit dans l'URL (?q=… ou ?type=…&genres=…) :
 * les résultats survivent au bouton « retour » et se partagent par lien.
 */
export default function SearchExperience({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const q = (params.get("q") || "").trim();
  const type = DISCOVER_TYPES.find((t) => t.value === params.get("type"))?.value;
  const genres = params.get("genres") || "";
  const sort =
    SORT_OPTIONS.find((s) => s.value === params.get("sort"))?.value ??
    "popularity.desc";

  // Requête API correspondant à l'URL courante (null = page d'exploration).
  const request = q
    ? `/api/search?query=${encodeURIComponent(q)}`
    : type
      ? `/api/discover?type=${type}&sort_by=${sort}${genres ? `&genres=${genres}` : ""}`
      : null;

  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();

    fetch(request, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        setLoaded({
          key: request,
          results: res.ok ? data.results || [] : [],
          correctedTo: data.correctedTo || null,
          error: res.ok ? null : data.error || "Une erreur est survenue.",
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setLoaded({
          key: request,
          results: [],
          correctedTo: null,
          error: "Impossible de contacter le serveur.",
        });
      });

    return () => controller.abort();
  }, [request]);

  const current = request && loaded?.key === request ? loaded : null;

  function navigate(next: URLSearchParams) {
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <>
      <SearchBar
        // La barre se resynchronise quand la recherche change via l'URL.
        key={q}
        initialText={q}
        filtersOpen={filtersOpen}
        filtersActive={Boolean(type) && !q}
        onToggleFilters={() => setFiltersOpen((v) => !v)}
        onSearch={(text) => {
          setFiltersOpen(false);
          navigate(new URLSearchParams(text ? { q: text } : {}));
        }}
      />

      <AnimatePresence initial={false}>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <FilterPanel
              key={`${type}-${genres}-${sort}`}
              initialType={type ?? "movie"}
              initialGenres={genres ? genres.split(",").map(Number) : []}
              initialSort={sort}
              onApply={(next) => {
                setFiltersOpen(false);
                const sp = new URLSearchParams({ type: next.type });
                if (next.genres.length) sp.set("genres", next.genres.join(","));
                if (next.sort !== "popularity.desc") sp.set("sort", next.sort);
                navigate(sp);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8">
        {!request ? (
          children
        ) : (
          <section aria-live="polite" aria-busy={!current}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-1">{q ? "Recherche" : "Filtres"}</p>
                <h2 className="font-display text-xl sm:text-2xl">
                  {q
                    ? `« ${current?.correctedTo || q} »`
                    : DISCOVER_TYPES.find((t) => t.value === type)?.label}
                  {current && !current.error && (
                    <span className="ml-2 font-mono text-sm text-muted">
                      {current.results.length} résultat
                      {current.results.length > 1 ? "s" : ""}
                    </span>
                  )}
                </h2>
                {current?.correctedTo && (
                  <p className="mt-1 text-sm text-ink-soft">
                    Aucun résultat pour « {q} » — résultats pour{" "}
                    <strong>{current.correctedTo}</strong>.
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate(new URLSearchParams())}
                className="btn btn-quiet"
              >
                <CloseIcon size={14} />
                Effacer
              </button>
            </div>

            {!current ? (
              <PosterGridSkeleton />
            ) : current.error ? (
              <EmptyState kana="エラー" title="Oups">
                {current.error}
              </EmptyState>
            ) : current.results.length === 0 ? (
              <EmptyState kana="なし" title="Aucun résultat">
                {q
                  ? "Vérifie l'orthographe ou essaie un autre titre."
                  : "Aucun titre ne correspond à ces filtres."}
              </EmptyState>
            ) : (
              <Stagger key={current.key} gap={0.03} className={GRID}>
                {current.results.map((item) => (
                  <StaggerItem key={`${item.media_type}-${item.id}`}>
                    <PosterCard item={item} />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </section>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

function SearchBar({
  initialText,
  filtersOpen,
  filtersActive,
  onToggleFilters,
  onSearch,
}: {
  initialText: string;
  filtersOpen: boolean;
  filtersActive: boolean;
  onToggleFilters: () => void;
  onSearch: (text: string) => void;
}) {
  const router = useRouter();
  const listId = useId();
  const wrapper = useRef<HTMLDivElement>(null);

  const [text, setText] = useState(initialText);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [suggestions, setSuggestions] = useState<{
    query: string;
    items: MediaCard[];
  } | null>(null);

  const trimmed = text.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();

    const timer = setTimeout(() => {
      fetch(`/api/search?query=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((data) =>
          setSuggestions({
            query: trimmed,
            items: (data.results || []).slice(0, 6),
          }),
        )
        .catch(() => {});
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // On n'affiche que les suggestions qui correspondent au texte actuel.
  const items =
    open && suggestions?.query === trimmed ? suggestions.items : [];

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown" && items.length > 0) {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp" && items.length > 0) {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlighted >= 0 && items[highlighted]) {
      e.preventDefault();
      setOpen(false);
      router.push(mediaHref(items[highlighted]));
    }
  }

  return (
    <div ref={wrapper} className="relative">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          onSearch(trimmed);
        }}
        className="flex flex-col gap-2.5 sm:flex-row"
      >
        <div className="relative flex-1">
          <SearchIcon
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            enterKeyHint="search"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
              setHighlighted(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Naruto, Breaking Bad, jjk…"
            aria-label="Rechercher un film, une série ou un anime"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            className="field !pl-10"
          />
        </div>
        <div className="flex gap-2.5">
          <button type="submit" className="btn btn-lg btn-primary flex-1 sm:flex-none">
            Rechercher
          </button>
          <button
            type="button"
            onClick={onToggleFilters}
            aria-expanded={filtersOpen}
            className={`btn btn-lg flex-1 sm:flex-none ${filtersOpen || filtersActive ? "btn-ink" : ""}`}
          >
            <FilterIcon size={16} />
            Filtres
          </button>
        </div>
      </form>

      <AnimatePresence>
        {items.length > 0 && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="panel absolute inset-x-0 top-full z-40 mt-2 origin-top overflow-hidden sm:right-auto sm:w-[min(100%,32rem)]"
          >
            {items.map((item, i) => (
              <li key={`${item.media_type}-${item.id}`} role="option" aria-selected={i === highlighted}>
                <Link
                  href={mediaHref(item)}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`flex items-center gap-3 px-3 py-2 transition-colors ${
                    i === highlighted ? "bg-sun/40" : ""
                  }`}
                >
                  <span className="relative h-14 w-[38px] shrink-0 overflow-hidden rounded-[3px] border border-ink bg-paper-deep">
                    {item.poster_path && (
                      <Image
                        src={tmdbImage(item.poster_path, "w92")}
                        alt=""
                        fill
                        sizes="38px"
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">
                      {item.title}
                    </span>
                    <span className="block text-xs text-muted">
                      {[KIND_LABELS[item.kind], item.year]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------

function FilterPanel({
  initialType,
  initialGenres,
  initialSort,
  onApply,
}: {
  initialType: DiscoverType;
  initialGenres: number[];
  initialSort: SortValue;
  onApply: (filters: {
    type: DiscoverType;
    genres: number[];
    sort: SortValue;
  }) => void;
}) {
  const [type, setType] = useState(initialType);
  const [genres, setGenres] = useState(initialGenres);
  const [sort, setSort] = useState(initialSort);

  const genreOptions = type === "movie" ? MOVIE_GENRES : TV_GENRES;

  function toggleGenre(id: number) {
    setGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  return (
    // La marge laisse la place à l'ombre portée du panneau.
    <div className="pb-2 pr-2 pt-5">
      <div className="panel flex flex-col gap-5 p-5">
        <fieldset>
          <legend className="eyebrow mb-2">Type</legend>
          <div className="flex flex-wrap gap-2">
            {DISCOVER_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-pressed={type === t.value}
                onClick={() => {
                  setType(t.value);
                  // Les genres ne sont pas les mêmes entre films et séries.
                  setGenres([]);
                }}
                className="chip"
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="eyebrow mb-2">Genres</legend>
          <div className="flex flex-wrap gap-2">
            {genreOptions.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={genres.includes(g.id)}
                onClick={() => toggleGenre(g.id)}
                className="chip"
              >
                {g.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="eyebrow mb-2">Trier par</legend>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                aria-pressed={sort === s.value}
                onClick={() => setSort(s.value)}
                className="chip"
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <button
            type="button"
            onClick={() => onApply({ type, genres, sort })}
            className="btn btn-lg btn-ink"
          >
            Afficher les résultats
          </button>
        </div>
      </div>
    </div>
  );
}
