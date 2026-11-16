import Rail from "@/components/Rail";
import PosterCard from "@/components/PosterCard";
import type { MediaCard } from "@/lib/types";

export default function PosterRail({
  title,
  eyebrow,
  items,
  ranked = false,
}: {
  title: string;
  eyebrow?: string;
  items: MediaCard[];
  ranked?: boolean;
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
          />
        </div>
      ))}
    </Rail>
  );
}
