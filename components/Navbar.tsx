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

  // Pas de navbar sur la home, elle a déjà ses propres boutons
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
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="font-display text-xl uppercase tracking-tight text-[#111111]"
        >
          Couzan-desu
        </Link>

        <div className="flex items-center gap-2 font-mono-utility text-xs uppercase tracking-wide">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`manga-btn px-4 py-2 ${
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
              className="manga-btn bg-white px-4 py-2 text-[#111111]"
            >
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="manga-btn bg-white px-4 py-2 text-[#111111]"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}