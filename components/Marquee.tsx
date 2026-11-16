/** Bandeau défilant en boucle (le contenu est doublé pour un raccord parfait). */
export default function Marquee({ words }: { words: string[] }) {
  const row = (hidden: boolean) => (
    <div
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-8 pr-8"
    >
      {words.map((word, i) => (
        <span key={i} className="flex items-center gap-8">
          {word}
          <span className="text-sun">★</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden border-b-2 border-ink bg-ink py-3 font-display text-sm uppercase tracking-widest text-paper sm:text-base">
      <div className="flex w-max animate-marquee">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
