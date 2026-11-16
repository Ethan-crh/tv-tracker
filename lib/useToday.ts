"use client";

import { useSyncExternalStore } from "react";
import { todayISO } from "@/lib/dates";

const subscribe = () => () => {};

/**
 * Date locale du jour ("AAAA-MM-JJ"), ou null pendant le rendu serveur :
 * tout ce qui dépend d'« aujourd'hui » doit attendre le navigateur, sinon le
 * HTML mis en cache affiche une date périmée.
 */
export function useToday(): string | null {
  return useSyncExternalStore(subscribe, todayISO, () => null);
}
