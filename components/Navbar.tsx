"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  if (pathname === "/") return null;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/recherche", label: "Rechercher" },
    { href: "/mes-listes", label: "Mes listes" },
    { href: "/calendrier", label: "Calendrier" },
  ];

  return (
    <nav className="halftone-bg sticky top-0 z-50 border-b-4 border-[#111111]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="shrink-0 font-display text-base uppercase tracking-tight text-[#111111] sm:text-xl"
        >
          MT
          <span className="hidden sm:inline">on Tracker</span>
        </Link>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide font-mono-utility text-[10px] uppercase tracking-wide sm:gap-2 sm:text-xs">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`manga-btn shrink-0 px-2.5 py-1.5 sm:px-4 sm:py-2 ${
                  active
                    ? "bg-[#E1263F] text-white"
                    : "bg-white text-[#111111]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {user ? (
            <button
              onClick={handleLogout}
              className="manga-btn shrink-0 bg-white px-2.5 py-1.5 text-[#111111] sm:px-4 sm:py-2"
            >
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="manga-btn shrink-0 bg-white px-2.5 py-1.5 text-[#111111] sm:px-4 sm:py-2"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}