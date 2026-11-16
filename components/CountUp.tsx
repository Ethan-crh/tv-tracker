"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

/** Compteur qui défile de 0 à `value` quand il entre à l'écran. */
export default function CountUp({
  value,
  decimals = 0,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();

  const format = (n: number) =>
    n.toLocaleString("fr-FR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    if (reduced) {
      node.textContent = format(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = format(latest);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView, reduced, decimals]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}
