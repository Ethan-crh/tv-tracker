import Link from "next/link";
import Image from "next/image";
import { StarIcon } from "@/components/Icons";
import { tmdbImage } from "@/lib/images";
import { KIND_LABELS, type MediaCard } from "@/lib/types";

export function mediaHref(item: { media_type: "movie" | "tv"; id: number }) {
  return item.media_type === "tv" ? `/serie/${item.id}` : `/film/${item.id}`;
}

/** Affiche seule, avec le survol « case de manga ». */
export function Poster({
  path,
  alt,
  sizes,
  preload = false,
  className = "",
}: {
  path: string | null;
  alt: string;
  sizes: string;
  preload?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden rounded-[4px] border-2 border-ink bg-paper-deep ${className}`}
    >
      {path ? (
        <Image
          src={tmdbImage(path, "w342")}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.06]"
        />
      ) : (
        <div className="halftone flex h-full items-center justify-center p-3 text-center font-display text-sm text-muted">
          {alt}
        </div>
      )}
    </div>
  );
}

export default function PosterCard({
  item,
  rank,
  subtitle,
  sizes = "(min-width: 1024px) 200px, (min-width: 640px) 25vw, 45vw",
  children,
}: {
  item: MediaCard;
  rank?: number;
  subtitle?: string;
  sizes?: string;
  children?: React.ReactNode;
}) {
  const meta =
    subtitle ??
    [KIND_LABELS[item.kind], item.year].filter(Boolean).join(" · ");

  return (
    <Link href={mediaHref(item)} className="group relative block">
      <div className="relative transition-[transform,filter] duration-300 ease-out-expo group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:drop-shadow-[5px_5px_0_#111111]">
        <Poster path={item.poster_path} alt={item.title} sizes={sizes} />

        {rank !== undefined && (
          <span className="absolute -left-2 -top-2 flex h-8 min-w-8 items-center justify-center rounded-[4px] border-2 border-ink bg-accent px-1 font-display text-sm text-white shadow-hard-sm">
            {rank}
          </span>
        )}

        {item.vote_average > 0 && (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full border-2 border-ink bg-sun px-1.5 py-0.5 text-[11px] font-bold leading-none">
            <StarIcon size={10} />
            {item.vote_average.toFixed(1)}
          </span>
        )}
      </div>

      <p className="mt-2.5 line-clamp-2 text-sm font-bold leading-snug transition-colors group-hover:text-accent">
        {item.title}
      </p>
      {meta && <p className="mt-0.5 text-xs text-muted">{meta}</p>}
      {children}
    </Link>
  );
}
