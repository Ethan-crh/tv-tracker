/** Note TMDB au format français : 7,8 */
export function formatRating(value: number): string {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
