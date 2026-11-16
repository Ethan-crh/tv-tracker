const BASE = "https://image.tmdb.org/t/p";

export type PosterSize = "w92" | "w154" | "w185" | "w342" | "w500";
export type BackdropSize = "w780" | "w1280";
export type StillSize = "w300";
export type ProfileSize = "w185";

export function tmdbImage(
  path: string,
  size: PosterSize | BackdropSize | StillSize | ProfileSize,
) {
  return `${BASE}/${size}${path}`;
}
