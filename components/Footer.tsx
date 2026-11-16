export default function Footer() {
  return (
    <footer className="mt-20 border-t-2 border-ink bg-ink text-paper">
      <div className="halftone-light">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-display text-lg">
            My TV-Board <span className="text-sun">つづく…</span>
          </p>
          <p className="max-w-md text-xs leading-relaxed text-paper/60">
            Ce produit utilise l&apos;API TMDB mais n&apos;est ni approuvé ni
            certifié par TMDB. Affiches et informations ©{" "}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-paper"
            >
              themoviedb.org
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
