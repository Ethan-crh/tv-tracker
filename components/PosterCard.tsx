import Link from "next/link";
import Image from "next/image";
import { StarIcon } from "@/components/Icons";
import { formatRating } from "@/lib/format";
import { tmdbImage } from "@/lib/images";
import { KIND_LABELS, type MediaCard } from "@/lib/types";

export function mediaHref(item: { media_type: "movie" | "tv"; id: number }) {
  return item.media_type === "tv" ? `/serie/${item.id}` : `/film/${item.id}`;
}

/** Affiche seule, ou un dégradé avec le titre si elle manque. */
export function Poster({
  path,
  alt,
  sizes,
  eager = false,
  className = "",
}: {
  path: string | null;
  alt: string;
  sizes: string;
  /** À activer pour les affiches visibles dès l'arrivée sur la page. */
  eager?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-fill ${className}`}>
      {path ? (
        <Image
          src={tmdbImage(path, "poster")}
          alt={alt}
          fill
          sizes={sizes}
          loading={eager ? "eager" : undefined}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-b from-[#e8e8ed] to-[#d2d2d7] p-3 text-center text-[13px] font-medium text-muted">
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
  eager = false,
}: {
  item: MediaCard;
  rank?: number;
  subtitle?: string;
  sizes?: string;
  eager?: boolean;
}) {
  const meta =
    subtitle ??
    [KIND_LABELS[item.kind], item.year].filter(Boolean).join(" · ");

  return (
    <Link href={mediaHref(item)} className="group block rounded-xl">
      <div className="relative rounded-xl shadow-poster transition-[transform,box-shadow] duration-500 ease-apple group-hover:-translate-y-1 group-hover:scale-[1.03] group-hover:shadow-lift group-active:scale-[0.99]">
        <Poster path={item.poster_path} alt={item.title} sizes={sizes} eager={eager} />
        {item.vote_average > 0 && (
          <span className="glass-dark absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white">
            <StarIcon size={10} className="text-star" />
            {formatRating(item.vote_average)}
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-[14px] font-medium leading-snug tracking-[-0.01em]">
        {rank !== undefined && (
          <span className="mr-1.5 font-semibold tabular-nums text-faint">{rank}</span>
        )}
        {item.title}
      </p>
      {meta && <p className="mt-0.5 text-[13px] text-muted">{meta}</p>}
    </Link>
  );
}
