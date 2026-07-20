"use client";

import Link from "next/link";
import Image from "next/image";
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
    { href: "/recherche", label: "Rechercher", icon: "🔍" },
    { href: "/mes-listes", label: "Mes listes", icon: "📋" },
    { href: "/calendrier", label: "Calendrier", icon: "📅" },
  ];

  return (
    <>
      {/* Barre du haut : logo + compte, visible partout */}
      <nav className="halftone-bg sticky top-0 z-50 border-b-4 border-[#111111]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2 sm:px-6 sm:py-2.5">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Mon Tracker"
              width={38}
              height={38}
              className="manga-panel rounded-sm"
            />
            <span className="hidden font-display text-lg uppercase tracking-tight text-[#111111] sm:inline">
              Mon Tracker
            </span>
          </Link>

          {/* Liens complets : uniquement à partir de tablette */}
          <div className="hidden items-center gap-2 font-mono-utility text-xs uppercase tracking-wide sm:flex">
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

          {/* Sur mobile : juste un bouton compte compact */}
          <div className="sm:hidden">
            {user ? (
              <button
                onClick={handleLogout}
                className="manga-btn bg-white px-3 py-1.5 text-[10px] text-[#111111]"
              >
                Déconnexion
              </button>
            ) : (
              <Link
                href="/login"
                className="manga-btn bg-white px-3 py-1.5 text-[10px] text-[#111111]"
              >
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Barre de navigation fixée en bas, uniquement sur mobile */}
      <div className="halftone-bg fixed bottom-0 left-0 right-0 z-50 border-t-4 border-[#111111] sm:hidden">
        <div className="flex items-stretch justify-around">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 font-mono-utility text-[10px] uppercase ${
                  active ? "bg-[#E1263F] text-white" : "text-[#111111]"
                }`}
              >
                <span className="text-lg leading-none">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}