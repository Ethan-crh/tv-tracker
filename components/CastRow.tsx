"use client";

import Image from "next/image";

type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

export default function CastRow({ cast }: { cast: CastMember[] | undefined }) {
  const filtered = (cast || []).slice(0, 12);

  if (filtered.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="font-display text-xl uppercase mb-3 text-[#111111]">
        Casting
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {filtered.map((member) => (
          <div key={member.id} className="flex-shrink-0 w-[100px] text-center">
            {member.profile_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                alt={member.name}
                width={100}
                height={100}
                className="rounded-full border-4 border-[#111111] object-cover aspect-square"
              />
            ) : (
              <div className="w-[100px] h-[100px] rounded-full border-4 border-[#111111] bg-gray-200" />
            )}
            <p className="mt-2 text-xs font-bold text-[#111111] line-clamp-1">
              {member.name}
            </p>
            <p className="text-[10px] text-[#6B6B6B] line-clamp-1">
              {member.character}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}