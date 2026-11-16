"use client";

import { useEffect } from "react";
import { AlertIcon } from "@/components/Icons";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="px-4 py-24">
      <div className="card mx-auto flex max-w-md flex-col items-center px-8 py-12 text-center">
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
          <AlertIcon size={26} />
        </span>
        <h1 className="section-title text-[22px]">Un problème est survenu</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Les données n&apos;ont pas pu être chargées. C&apos;est sans doute
          passager.
        </p>
        <button onClick={() => unstable_retry()} className="btn btn-primary mt-6">
          Réessayer
        </button>
      </div>
    </main>
  );
}
