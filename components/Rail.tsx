"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons";

/** Bande horizontale défilante avec flèches (souris) et inertie (tactile). */
export default function Rail({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  function scrollBy(direction: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h2 className="section-title text-[22px] sm:text-[28px]">{title}</h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => scrollBy(-1)}
            disabled={edges.start}
            aria-label={`${title} : défiler vers la gauche`}
            className="btn btn-icon"
          >
            <ChevronLeftIcon size={18} />
          </button>
          <button
            onClick={() => scrollBy(1)}
            disabled={edges.end}
            aria-label={`${title} : défiler vers la droite`}
            className="btn btn-icon"
          >
            <ChevronRightIcon size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        onScroll={measure}
        className="scrollbar-hide -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-8 pt-3 sm:-mx-6 sm:scroll-px-6 sm:gap-5 sm:px-6"
      >
        {children}
      </div>
    </section>
  );
}
