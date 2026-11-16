"use client";

import { useEffect } from "react";

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
    <main className="px-4 py-20">
      <div className="panel halftone mx-auto flex max-w-md flex-col items-center px-6 py-10 text-center">
        <p aria-hidden="true" className="mb-3 font-display text-4xl text-accent">
          エラー
        </p>
        <h1 className="font-display text-xl">Quelque chose a cassé</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
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
