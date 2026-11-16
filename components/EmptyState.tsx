import Link from "next/link";
import type { ReactNode } from "react";

/** Message centré pour les listes vides, les erreurs et les pages protégées. */
export default function EmptyState({
  kana,
  title,
  children,
  action,
}: {
  /** Petit mot japonais décoratif affiché en grand. */
  kana?: string;
  title: string;
  children?: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="panel halftone mx-auto flex max-w-md flex-col items-center px-6 py-10 text-center">
      {kana && (
        <p aria-hidden="true" className="mb-3 font-display text-4xl text-accent">
          {kana}
        </p>
      )}
      <h2 className="font-display text-xl">{title}</h2>
      {children && (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{children}</p>
      )}
      {action && (
        <Link href={action.href} className="btn btn-primary mt-6">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function SignInPrompt({ children }: { children: ReactNode }) {
  return (
    <EmptyState
      kana="ようこそ"
      title="Connecte-toi pour continuer"
      action={{ href: "/login", label: "Se connecter" }}
    >
      {children}
    </EmptyState>
  );
}
