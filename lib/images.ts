/**
 * Images TMDB.
 *
 * Plutôt que de faire repasser chaque affiche par l'optimiseur de Next
 * (/_next/image : charge serveur et quota chez l'hébergeur), on demande
 * directement à TMDB la taille adaptée : il sert déjà chaque image en
 * plusieurs largeurs depuis son CDN. `tmdbImage` produit un chemin interne
 * que `lib/tmdb-image-loader.ts` traduit en URL TMDB selon la largeur voulue.
 */
export type TmdbImageKind = "poster" | "backdrop" | "still" | "profile";

export function tmdbImage(path: string, kind: TmdbImageKind) {
  return `/tmdb/${kind}${path}`;
}
