import Link from "next/link";
import type { ReactNode } from "react";
import { UserIcon } from "@/components/Icons";

/** Message centré pour les listes vides, les erreurs et les pages protégées. */
export default function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="card mx-auto flex max-w-md flex-col items-center px-8 py-12 text-center">
      {icon && (
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          {icon}
        </span>
      )}
      <h2 className="section-title text-[22px]">{title}</h2>
      {children && (
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{children}</p>
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
      icon={<UserIcon size={26} />}
      title="Connecte-toi pour continuer"
      action={{ href: "/login", label: "Se connecter" }}
    >
      {children}
    </EmptyState>
  );
}
