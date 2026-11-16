import Image from "next/image";
import Rail from "@/components/Rail";
import { tmdbImage } from "@/lib/images";
import type { CastMember } from "@/lib/types";

export default function CastRow({ cast }: { cast: CastMember[] }) {
  if (cast.length === 0) return null;

  return (
    <Rail title="Distribution">
      {cast.map((member) => (
        <div key={member.id} className="w-[100px] shrink-0 snap-start text-center">
          <div className="relative mx-auto h-[88px] w-[88px] overflow-hidden rounded-full bg-fill shadow-[0_2px_8px_rgb(0_0_0/0.1)]">
            {member.profile_path ? (
              <Image
                src={tmdbImage(member.profile_path, "profile")}
                alt=""
                fill
                sizes="88px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center bg-gradient-to-b from-[#c7c7cc] to-[#8e8e93] text-[28px] font-semibold text-white">
                {member.name.charAt(0)}
              </span>
            )}
          </div>
          <p className="mt-2.5 line-clamp-2 text-[13px] font-medium leading-tight">
            {member.name}
          </p>
          {member.character && (
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-tight text-muted">
              {member.character}
            </p>
          )}
        </div>
      ))}
    </Rail>
  );
}
