import Image from "next/image";
import Rail from "@/components/Rail";
import { tmdbImage } from "@/lib/images";
import type { CastMember } from "@/lib/types";

export default function CastRow({ cast }: { cast: CastMember[] }) {
  if (cast.length === 0) return null;

  return (
    <Rail title="Casting">
      {cast.map((member) => (
        <div key={member.id} className="w-[96px] shrink-0 snap-start text-center">
          <div className="relative mx-auto h-[88px] w-[88px] overflow-hidden rounded-full border-2 border-ink bg-paper-deep">
            {member.profile_path ? (
              <Image
                src={tmdbImage(member.profile_path, "w185")}
                alt=""
                fill
                sizes="88px"
                className="object-cover"
              />
            ) : (
              <span className="halftone flex h-full items-center justify-center font-display text-2xl text-muted">
                {member.name.charAt(0)}
              </span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-xs font-bold leading-tight">
            {member.name}
          </p>
          {member.character && (
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-muted">
              {member.character}
            </p>
          )}
        </div>
      ))}
    </Rail>
  );
}
