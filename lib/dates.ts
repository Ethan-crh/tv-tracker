/**
 * TMDB renvoie des dates "AAAA-MM-JJ" sans fuseau. `new Date("2026-01-05")`
 * les interprète en UTC, ce qui décale d'un jour selon le fuseau : on les
 * construit donc explicitement en heure locale.
 */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Date locale du jour au format "AAAA-MM-JJ". */
export function todayISO(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

export function daysBetween(fromDay: string, toDay: string): number {
  const ms = parseDay(toDay).getTime() - parseDay(fromDay).getTime();
  return Math.round(ms / 86_400_000);
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatMonth(day: string): string {
  return capitalize(
    parseDay(day).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
  );
}

export function formatLongDay(day: string): string {
  return capitalize(
    parseDay(day).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  );
}

export function formatShortDay(day: string): string {
  return parseDay(day).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "Aujourd'hui", "Demain", "Dans 5 j"… pour une date à venir. */
export function relativeDay(today: string, day: string): string {
  const diff = daysBetween(today, day);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  if (diff < 0) return "Sorti";
  if (diff < 14) return `Dans ${diff} j`;
  if (diff < 60) return `Dans ${Math.round(diff / 7)} sem.`;
  return `Dans ${Math.round(diff / 30)} mois`;
}

export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}
