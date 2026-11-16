import type { ReactNode } from "react";

export default function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 sm:mb-10">
      <p className="eyebrow mb-2 flex items-center gap-2">
        <span className="inline-block h-[3px] w-6 bg-accent" />
        {eyebrow}
      </p>
      <h1 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
      {children && (
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
          {children}
        </p>
      )}
    </header>
  );
}
