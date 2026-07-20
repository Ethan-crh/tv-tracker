"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import TopRow from "@/components/TopRow";
import { MOVIE_GENRES, TV_GENRES, SORT_OPTIONS } from "@/lib/genres";

type SearchResult = {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  vote_average?: number;
};

type DiscoverItem = {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  date: string;
  vote_average?: number;
};

type FilterType = "movie" | "serie" | "anime";

export default function RecherchePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // --- Filtres ---
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("movie");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [filterResults, setFilterResults] = useState<DiscoverItem[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);

  const genreOptions = filterType === "movie" ? MOVIE_GENRES : TV_GENRES;

  function toggleGenre(id: number) {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  async function applyFilters() {
    setFilterLoading(true);
    setFilterApplied(true);
    setHasSearched(false);

    const params = new URLSearchParams({
      type: filterType,
      sort_by: sortBy,
    });
    if (selectedGenres.length > 0) {
      params.set("genres", selectedGenres.join(","));
    }

    try {
      const res = await fetch(`/api/discover?${params.toString()}`);
      const data = await res.json();
      setFilterResults(data.results || []);
    } catch {
      setFilterResults([]);
    } finally {
      setFilterLoading(false);
      setFilterOpen(false);
    }
  }

  function resetFilters() {
    setFilterApplied(false);
    setFilterResults([]);
    setSelectedGenres([]);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?query=${encodeURIComponent(query)}`,
        );
        const data = await res.json();
        if (res.ok) {
          setSuggestions((data.results || []).slice(0, 6));
          setShowSuggestions(true);
        }
      } catch {
        // silencieux
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setShowSuggestions(false);
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setFilterApplied(false);

    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        setResults([]);
      } else {
        setResults(data.results);
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-4 max-w-5xl mx-auto sm:p-8">
      {" "}
      <h1 className="font-display text-3xl uppercase mb-6">
        Rechercher un titre
      </h1>
      <div ref={wrapperRef} className="relative mb-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Ex: Naruto, Breaking Bad, jjk..."
            className="w-full border-3 border-[#111111] rounded-md px-3 py-2 text-sm sm:flex-1 sm:px-4 sm:text-base"
            autoComplete="off"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="manga-btn flex-1 bg-[#E1263F] px-4 py-2 text-xs text-white sm:flex-none sm:px-6 sm:text-sm"
            >
              Rechercher
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="manga-btn flex-1 bg-white px-4 py-2 text-xs text-[#111111] sm:flex-none sm:px-4 sm:text-sm"
            >
              Filtres
            </button>
          </div>
        </form>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border-2 border-[#111111] rounded-md shadow-lg overflow-hidden">
            {" "}
            {suggestions.map((item) => {
              const title = item.title || item.name;
              const date = item.release_date || item.first_air_date;
              return (
                <Link
                  key={item.id}
                  href={
                    item.media_type === "tv"
                      ? `/serie/${item.id}`
                      : `/film/${item.id}`
                  }
                  onClick={() => setShowSuggestions(false)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition"
                >
                  {item.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                      alt={title || ""}
                      width={32}
                      height={48}
                      className="rounded"
                    />
                  ) : (
                    <div className="w-8 h-12 bg-gray-200 rounded" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-gray-500">
                      {item.media_type === "movie" ? "Film" : "Série"}
                      {date ? ` · ${date.slice(0, 4)}` : ""}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      {filterOpen && (
        <div className="manga-panel bg-white p-5 mb-8">
          <div className="mb-4">
            <p className="font-mono-utility text-xs uppercase mb-2 text-gray-500">
              Type
            </p>
            <div className="flex gap-2">
              {(["movie", "serie", "anime"] as FilterType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setFilterType(t);
                    setSelectedGenres([]);
                  }}
                  className={`manga-btn px-4 py-2 text-sm ${
                    filterType === t
                      ? "bg-[#E1263F] text-white"
                      : "bg-white text-[#111111]"
                  }`}
                >
                  {t === "movie" ? "Film" : t === "serie" ? "Série" : "Anime"}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="font-mono-utility text-xs uppercase mb-2 text-gray-500">
              Genre
            </p>
            <div className="flex flex-wrap gap-2">
              {genreOptions.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGenre(g.id)}
                  className={`manga-btn px-3 py-1.5 text-xs ${
                    selectedGenres.includes(g.id)
                      ? "bg-[#E1263F] text-white"
                      : "bg-white text-[#111111]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="font-mono-utility text-xs uppercase mb-2 text-gray-500">
              Trier par
            </p>
            <div className="flex gap-2">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSortBy(s.value)}
                  className={`manga-btn px-3 py-1.5 text-xs ${
                    sortBy === s.value
                      ? "bg-[#E1263F] text-white"
                      : "bg-white text-[#111111]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={applyFilters}
            className="manga-btn bg-[#111111] px-6 py-2 text-white text-sm"
          >
            Appliquer
          </button>
        </div>
      )}
      {loading && <p>Chargement...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {filterLoading && <p>Chargement des résultats filtrés...</p>}
      {hasSearched && !loading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-10">
          {results.map((item) => {
            const title = item.title || item.name;
            const date = item.release_date || item.first_air_date;

            return (
              <Link
                key={item.id}
                href={
                  item.media_type === "tv"
                    ? `/serie/${item.id}`
                    : `/film/${item.id}`
                }
                className="relative flex flex-col hover:opacity-80 transition"
              >
                {item.vote_average !== undefined && item.vote_average > 0 && (
                  <span className="manga-panel absolute right-1 top-1 z-10 flex items-center gap-1 bg-[#FFD400] px-2 py-0.5 text-xs font-bold text-[#111111]">
                    ★ {item.vote_average.toFixed(1)}
                  </span>
                )}
                {item.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                    alt={title || ""}
                    width={342}
                    height={513}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="bg-gray-200 aspect-[2/3] rounded-lg flex items-center justify-center text-gray-400 text-sm">
                    Pas d&apos;image
                  </div>
                )}
                <p className="mt-2 font-medium text-sm">{title}</p>
                <p className="text-xs text-gray-500">
                  {item.media_type === "movie" ? "Film" : "Série"}
                  {date ? ` · ${date.slice(0, 4)}` : ""}
                </p>
              </Link>
            );
          })}
        </div>
      )}
      {filterApplied && !filterLoading && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl uppercase">
              Résultats filtrés
            </h2>
            <button
              onClick={resetFilters}
              className="text-sm underline text-gray-500"
            >
              Réinitialiser
            </button>
          </div>

          {filterResults.length === 0 && (
            <p className="text-gray-500">Aucun résultat pour ces filtres.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {filterResults.map((item) => (
              <Link
                key={`${item.media_type}-${item.id}`}
                href={
                  item.media_type === "tv"
                    ? `/serie/${item.id}`
                    : `/film/${item.id}`
                }
                className="relative flex flex-col hover:opacity-80 transition"
              >
                {item.vote_average !== undefined && item.vote_average > 0 && (
                  <span className="manga-panel absolute right-1 top-1 z-10 flex items-center gap-1 bg-[#FFD400] px-2 py-0.5 text-xs font-bold text-[#111111]">
                    ★ {item.vote_average.toFixed(1)}
                  </span>
                )}
                {item.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                    alt={item.title}
                    width={342}
                    height={513}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="bg-gray-200 aspect-[2/3] rounded-lg flex items-center justify-center text-gray-400 text-sm">
                    Pas d&apos;image
                  </div>
                )}
                <p className="mt-2 font-medium text-sm">{item.title}</p>
                <p className="text-xs text-gray-500">
                  {item.date ? item.date.slice(0, 4) : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
      {!hasSearched && !filterApplied && (
        <>
          <TopRow title="Top Films du moment" category="films" />
          <TopRow title="Top Anime du moment" category="animes" />
          <TopRow title="Top Séries du moment" category="series" />
        </>
      )}
    </main>
  );
}
