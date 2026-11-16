"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAuth } from "@/components/AuthProvider";
import {
  CalendarIcon,
  ChartIcon,
  ListIcon,
  LogoutIcon,
  SearchIcon,
  UserIcon,
} from "@/components/Icons";

const LINKS = [
  { href: "/recherche", label: "Explorer", Icon: SearchIcon },
  { href: "/mes-listes", label: "Mes listes", Icon: ListIcon },
  { href: "/calendrier", label: "Calendrier", Icon: CalendarIcon },
  { href: "/statistiques", label: "Stats", Icon: ChartIcon },
];

const SPRING = { type: "spring", stiffness: 480, damping: 36 } as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase, user, loading } = useAuth();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const account = loading ? (
    <span className="h-9 w-24" />
  ) : user ? (
    <button
      onClick={handleLogout}
      className="btn btn-quiet"
      title={user.email ?? undefined}
    >
      <LogoutIcon size={16} />
      <span className="hidden md:inline">Déconnexion</span>
    </button>
  ) : (
    <Link href="/login" className="btn btn-ink">
      <UserIcon size={16} />
      Connexion
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt=""
              width={36}
              height={36}
              className="rounded-[4px] border-2 border-ink transition-transform duration-300 ease-out-expo group-hover:-rotate-6 group-hover:scale-105"
            />
            <span className="font-display text-lg leading-none tracking-tight">
              My TV-Board
            </span>
          </Link>

          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-1 sm:flex"
          >
            {LINKS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-[4px] px-3.5 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                    active ? "text-white" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={SPRING}
                      className="absolute inset-0 rounded-[4px] bg-ink"
                    />
                  )}
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center">{account}</div>
        </div>
      </header>

      {/* Barre d'onglets fixée en bas, uniquement sur mobile */}
      <nav
        aria-label="Navigation principale"
        className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t-2 border-ink bg-paper/95 backdrop-blur-md sm:hidden"
      >
        <div className="flex items-stretch">
          {LINKS.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5 font-mono text-[10px] uppercase tracking-wide transition-colors ${
                  active ? "text-accent" : "text-ink-soft"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tab-indicator"
                    transition={SPRING}
                    className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-accent"
                  />
                )}
                <motion.span
                  animate={{ y: active ? -1 : 0, scale: active ? 1.12 : 1 }}
                  transition={SPRING}
                >
                  <Icon size={20} />
                </motion.span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
