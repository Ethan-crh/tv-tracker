"use client";

import { useRef } from "react";
import { useInView } from "motion/react";

/**
 * Vrai dès qu'un bloc HTML est visible à l'écran (une seule fois).
 *
 * À utiliser pour déclencher les animations des éléments qu'il contient,
 * plutôt que `whileInView` sur chaque élément : Safari détecte mal les
 * éléments SVG (anneaux, camembert) et les petits éléments imbriqués, qui
 * restaient alors figés dans leur état de départ sur iPhone.
 */
export function useAppear<T extends Element = HTMLDivElement>(amount = 0.25) {
  const ref = useRef<T>(null);
  const visible = useInView(ref, { once: true, amount });
  return [ref, visible] as const;
}
