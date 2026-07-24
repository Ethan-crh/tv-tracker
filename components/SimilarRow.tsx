"use client";

import Link from "next/link";
import Image from "next/image";

type SimilarItem = {
  id: number;
  poster_path: string | null;
  title?: string;
  name?: string;
};

export default function SimilarRow({
  items,
  mediaType,
  title,
}: {
  items: SimilarItem[] | undefined;
  mediaType: "tv" | "movie";
  title: string;
}) {
  const filtered = (items || []).filter((i) => i.poster_path).slice(0, 15);

  if (filtered.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl uppercase mb-3 text-[#111111]">
        {title}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {filtered.map((item) => (
          <Link
            key={item.id}
            href={mediaType === "tv" ? `/serie/${item.id}` : `/film/${item.id}`}
            className="flex-shrink-0 w-[120px]"
          >
            <Image
              src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
              alt={item.title || item.name || ""}
              width={120}
              height={180}
              className="rounded-sm border-4 border-[#111111]"
            />
            <p className="mt-2 text-xs font-medium line-clamp-2 text-[#111111]">
              {item.title || item.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}