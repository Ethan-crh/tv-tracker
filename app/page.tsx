import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BackgroundCarousel from "@/components/BackgroundCarousel";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundCarousel />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-8 text-center">
        <div className="speed-burst pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2" />

        <span className="manga-panel inline-block rotate-[-2deg] bg-[#FFD400] px-3 py-1 font-mono-utility text-xs font-bold uppercase tracking-widest text-[#111111]">
          話1 · Premier épisode
        </span>

        <h1 className="manga-panel rotate-[-1deg] bg-[#F7F5F0] px-10 py-6 font-display text-5xl uppercase leading-none tracking-tight text-[#111111] sm:text-6xl">
          Couzan-desu
        </h1>

        <p className="max-w-md text-[#3a3a3a]">
          Films, séries, animes — coche chaque épisode et retrouve toujours
          où tu en es.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/recherche"
            className="manga-btn bg-[#E1263F] px-7 py-3 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E1263F]"
          >
            Rechercher un titre
          </Link>

          {user && (
            <>
              <Link
                href="/mes-listes"
                className="manga-btn bg-white px-7 py-3 text-sm font-bold text-[#111111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E1263F]"
              >
                Mes listes
              </Link>
              <Link
                href="/calendrier"
                className="manga-btn bg-white px-7 py-3 text-sm font-bold text-[#111111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E1263F]"
              >
                Calendrier
              </Link>
            </>
          )}
        </div>

        <div className="mt-4 font-mono-utility text-xs text-[#6B6B6B]">
          {user ? (
            <p>
              Connecté · <span className="text-[#111111]">{user.email}</span>
            </p>
          ) : (
            <p className="flex gap-4">
              <Link
                href="/login"
                className="underline decoration-[#E1263F] underline-offset-4 hover:text-[#111111]"
              >
                Se connecter
              </Link>
              <Link
                href="/signup"
                className="underline decoration-[#E1263F] underline-offset-4 hover:text-[#111111]"
              >
                S&apos;inscrire
              </Link>
            </p>
          )}
        </div>

        <p className="mt-6 font-display text-lg text-[#6B6B6B]">つづく…</p>
      </div>
    </main>
  );
}