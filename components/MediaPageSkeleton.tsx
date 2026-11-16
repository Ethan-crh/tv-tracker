import Skeleton from "@/components/Skeleton";

export default function MediaPageSkeleton() {
  return (
    <main aria-busy="true" aria-label="Chargement">
      <div className="border-b-2 border-ink bg-ink">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:gap-10 sm:px-6 sm:py-14">
          <div className="mx-auto aspect-[2/3] w-40 shrink-0 animate-pulse rounded-[4px] bg-paper/15 sm:mx-0 sm:w-56" />
          <div className="flex-1 space-y-4">
            <div className="h-4 w-40 animate-pulse rounded bg-paper/15" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-paper/15" />
            <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-paper/15" />
            <div className="h-4 w-5/6 max-w-2xl animate-pulse rounded bg-paper/15" />
            <div className="h-4 w-2/3 max-w-2xl animate-pulse rounded bg-paper/15" />
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:px-6">
        <Skeleton className="mb-3 h-8 w-40" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </main>
  );
}
