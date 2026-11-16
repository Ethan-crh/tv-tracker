"use client";

import { useCallback, useState } from "react";
import Modal from "@/components/Modal";
import { CloseIcon, PlayIcon } from "@/components/Icons";
import type { Video } from "@/lib/types";

export default function TrailerModal({ trailer }: { trailer: Video | null }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  if (!trailer) return null;

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-sun">
        <PlayIcon size={14} />
        Bande-annonce
      </button>

      <Modal open={open} onClose={close} label="Bande-annonce" className="max-w-4xl p-2 sm:p-3">
        <button
          onClick={close}
          aria-label="Fermer la bande-annonce"
          className="btn btn-primary absolute -right-3 -top-3 z-10 !p-2"
        >
          <CloseIcon size={16} />
        </button>
        <div className="aspect-video w-full overflow-hidden rounded-[2px] bg-ink">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}?autoplay=1`}
            title="Bande-annonce"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      </Modal>
    </>
  );
}
