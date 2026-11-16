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
      <button onClick={() => setOpen(true)} className="btn btn-light btn-lg">
        <PlayIcon size={15} />
        Bande-annonce
      </button>

      <Modal open={open} onClose={close} label="Bande-annonce" dark className="max-w-5xl">
        <button
          onClick={close}
          aria-label="Fermer la bande-annonce"
          className="btn btn-glass btn-icon absolute -top-12 right-0"
        >
          <CloseIcon size={18} />
        </button>
        <div className="aspect-video w-full overflow-hidden rounded-[22px]">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}?autoplay=1`}
            title="Bande-annonce"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            className="h-full w-full"
          />
        </div>
      </Modal>
    </>
  );
}
