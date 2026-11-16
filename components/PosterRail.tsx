import Rail from "@/components/Rail";
import PosterCard from "@/components/PosterCard";
import type { MediaCard } from "@/lib/types";

export default function PosterRail({
  title,
  eyebrow,
  items,
  ranked = false,
  eager = false,
}: {
  title: string;
  eyebrow?: string;
  items: MediaCard[];
  ranked?: boolean;
  /** Rail visible dès l'arrivée : ses premières affiches chargent tout de suite. */
  eager?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <Rail title={title} eyebrow={eyebrow}>
      {items.map((item, i) => (
        <div
          key={`${item.media_type}-${item.id}`}
          className="w-[132px] shrink-0 snap-start sm:w-[160px]"
        >
          <PosterCard
            item={item}
            rank={ranked ? i + 1 : undefined}
            sizes="160px"
            eager={eager && i < 8}
          />
        </div>
      ))}
    </Rail>
  );
}
