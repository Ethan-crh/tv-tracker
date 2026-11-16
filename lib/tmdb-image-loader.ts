"use client";

/** Largeurs que le CDN de TMDB sait servir, par type d'image. */
const SIZES: Record<string, number[]> = {
  poster: [92, 154, 185, 342, 500, 780],
  backdrop: [300, 780, 1280],
  still: [92, 185, 300],
  profile: [45, 185],
};

const TMDB_PATH = /^\/tmdb\/(poster|backdrop|still|profile)(\/[^/]+)$/;

/**
 * Chargeur d'images global (voir next.config.ts) : choisit la plus petite
 * taille TMDB au moins aussi large que la largeur demandée par le navigateur.
 * Les images locales sont marquées `unoptimized` et ne passent pas ici.
 */
export default function tmdbImageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
}): string {
  const match = TMDB_PATH.exec(src);
  if (!match) return src;

  const sizes = SIZES[match[1]];
  const size = sizes.find((s) => s >= width) ?? sizes[sizes.length - 1];
  return `https://image.tmdb.org/t/p/w${size}${match[2]}`;
}
