import Link from "next/link";

const LINKS = [
  { href: "/recherche", label: "Explorer" },
  { href: "/mes-listes", label: "Mes listes" },
  { href: "/calendrier", label: "Calendrier" },
  { href: "/statistiques", label: "Statistiques" },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-hairline bg-paper sm:mt-32">
      <div className="mx-auto max-w-6xl px-4 py-8 text-[12px] leading-relaxed text-muted sm:px-6">
        <p>
          Ce produit utilise l&apos;API TMDB mais n&apos;est ni approuvé ni
          certifié par TMDB. Affiches, résumés et informations ©{" "}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            themoviedb.org
          </a>
          .
        </p>
        <div className="mt-4 flex flex-col gap-2 border-t border-hairline pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p>My TV-Board — films, séries et animes.</p>
          <nav aria-label="Pied de page" className="flex flex-wrap items-center">
            {LINKS.map((link, i) => (
              <span key={link.href} className="flex items-center">
                {i > 0 && <span className="mx-2.5 h-3 w-px bg-line" />}
                <Link href={link.href} className="text-ink-soft hover:underline">
                  {link.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
