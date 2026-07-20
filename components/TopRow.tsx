"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type TopItem = {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
};

export default function TopRow({
  title,
  category,
}: {
  title: string;
  category: "films" | "series" | "animes";
}) {
  const [items, setItems] = useState<TopItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/top?category=${category}`);
      const data = await res.json();
      setItems(data.items || []);
    }
    load();
  }, [category]);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="font-display text-2xl uppercase mb-3 text-[#111111]">
        {title}
      </h2>

      <div className="relative">
        <button
          onClick={() => scroll("left")}
          aria-label="Défiler vers la gauche"
          className="manga-btn absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 -translate-x-3 bg-white px-2 py-3 text-[#111111] sm:block"
        >
          ‹
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide scroll-smooth"
        >
          {items.map((item, i) => (
            <Link
              key={`${item.media_type}-${item.id}`}
              href={
                item.media_type === "tv"
                  ? `/serie/${item.id}`
                  : `/film/${item.id}`
              }
              className="relative flex-shrink-0 w-[140px] snap-start"
            >
              <span className="manga-panel absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center bg-[#E1263F] font-display text-sm text-white">
                {i + 1}
              </span>
              {item.poster_path && (
                <Image
                  src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                  alt={item.title}
                  width={140}
                  height={210}
                  className="manga-panel rounded-sm"
                />
              )}
              <p className="mt-2 text-xs font-medium line-clamp-2">
                {item.title}
              </p>
            </Link>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          aria-label="Défiler vers la droite"
          className="manga-btn absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 translate-x-3 bg-white px-2 py-3 text-[#111111] sm:block"
        >
          ›
        </button>
      </div>
    </section>
  );
}
