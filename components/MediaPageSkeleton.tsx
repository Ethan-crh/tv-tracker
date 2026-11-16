import Skeleton from "@/components/Skeleton";

const BLOCK = "animate-pulse rounded-lg bg-white/10";

export default function MediaPageSkeleton() {
  return (
    <main aria-busy="true" aria-label="Chargement">
      <div className="bg-night">
        <div className="mx-auto flex min-h-[min(82svh,780px)] max-w-6xl items-end gap-10 px-5 pb-10 pt-40 sm:px-6 sm:pb-14">
          <div className={`hidden aspect-[2/3] w-52 shrink-0 !rounded-2xl md:block lg:w-60 ${BLOCK}`} />
          <div className="flex-1 space-y-4">
            <div className={`h-4 w-48 ${BLOCK}`} />
            <div className={`h-14 w-3/4 ${BLOCK}`} />
            <div className={`h-4 w-full max-w-2xl ${BLOCK}`} />
            <div className={`h-4 w-5/6 max-w-2xl ${BLOCK}`} />
            <div className={`mt-8 h-10 w-80 !rounded-full ${BLOCK}`} />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Skeleton className="mb-6 h-9 w-44" />
        <div className="card overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex gap-4 border-b border-hairline p-4 last:border-b-0">
              <Skeleton className="h-7 w-7 !rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-3 h-3 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
