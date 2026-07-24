"use client";

import { useState } from "react";

type Video = {
  key: string;
  site: string;
  type: string;
  iso_639_1?: string;
  official?: boolean;
};

function pickTrailer(videos: Video[] | undefined): Video | null {
  if (!videos || videos.length === 0) return null;

  const youtube = videos.filter((v) => v.site === "YouTube");

  return (
    youtube.find((v) => v.type === "Trailer" && v.iso_639_1 === "fr") ||
    youtube.find((v) => v.type === "Trailer") ||
    youtube.find((v) => v.type === "Teaser") ||
    youtube[0] ||
    null
  );
}

export default function TrailerModal({
  videos,
}: {
  videos: Video[] | undefined;
}) {
  const [open, setOpen] = useState(false);
  const trailer = pickTrailer(videos);

  if (!trailer) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="manga-btn bg-[#FFD400] px-4 py-2 text-xs font-bold text-[#111111]"
      >
        ▶ Bande-annonce
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#111111]/80"
            onClick={() => setOpen(false)}
          />
          <div className="manga-panel relative w-full max-w-3xl bg-[#F7F5F0] p-4">
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="manga-btn absolute -right-3 -top-3 z-10 bg-[#E1263F] px-3 py-1 text-sm font-bold text-white"
            >
              ✕
            </button>
            <div className="aspect-video w-full overflow-hidden border-4 border-[#111111]">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                title="Bande-annonce"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}