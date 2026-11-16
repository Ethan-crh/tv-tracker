"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/components/AuthProvider";
import {
  CalendarIcon,
  ChartIcon,
  ListIcon,
  LogoutIcon,
  SearchIcon,
} from "@/components/Icons";

const LINKS = [
  { href: "/recherche", label: "Explorer", short: "Explorer", Icon: SearchIcon },
  { href: "/mes-listes", label: "Mes listes", short: "Listes", Icon: ListIcon },
  { href: "/calendrier", label: "Calendrier", short: "Calendrier", Icon: CalendarIcon },
  { href: "/statistiques", label: "Statistiques", short: "Stats", Icon: ChartIcon },
];

const SPRING = { type: "spring", stiffness: 500, damping: 38 } as const;

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="glass sticky top-0 z-50 border-b border-hairline">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[52px] sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo-64.png"
              alt=""
              width={28}
              height={28}
              unoptimized
              className="h-7 w-7 rounded-[7px] shadow-[0_1px_3px_rgb(0_0_0/0.2)]"
            />
            <span className="text-[17px] font-semibold tracking-[-0.02em]">
              My TV-Board
            </span>
          </Link>

          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-0.5 sm:flex"
          >
            {LINKS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
                    active ? "text-ink" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={SPRING}
                      className="absolute inset-0 rounded-full bg-black/[0.06]"
                    />
                  )}
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </nav>

          <AccountMenu />
        </div>
      </header>

      {/* Barre d'onglets façon iOS, uniquement sur mobile */}
      <nav
        aria-label="Navigation principale"
        className="glass pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-hairline sm:hidden"
      >
        <div className="flex h-[52px] items-stretch">
          {LINKS.map(({ href, short, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium tracking-normal transition-colors duration-200 ${
                  active ? "text-accent" : "text-faint"
                }`}
              >
                <motion.span
                  animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }}
                  transition={SPRING}
                >
                  <Icon size={23} strokeWidth={active ? 2.2 : 1.7} />
                </motion.span>
                {short}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function AccountMenu() {
  const router = useRouter();
  const { supabase, user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) return <span className="h-8 w-8" />;

  if (!user) {
    return (
      <Link href="/login" className="btn btn-primary btn-sm">
        Connexion
      </Link>
    );
  }

  const initial = (user.email || "?").charAt(0).toUpperCase();

  return (
    <div ref={wrapper} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Mon compte"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#a1a1a6] to-[#6e6e73] text-[14px] font-semibold text-white shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.2)] transition-transform duration-200 active:scale-95"
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.18, ease: [0.28, 0.11, 0.32, 1] }}
            className="glass absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl p-1.5 shadow-float ring-1 ring-black/5"
          >
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#a1a1a6] to-[#6e6e73] text-[15px] font-semibold text-white">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] text-muted">Connecté</p>
                <p className="truncate text-[14px] font-medium">{user.email}</p>
              </div>
            </div>
            <div className="mx-3 my-1 h-px bg-hairline" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[14px] font-medium text-danger transition-colors hover:bg-black/5"
            >
              <LogoutIcon size={17} />
              Se déconnecter
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
