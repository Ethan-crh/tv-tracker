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
    <header className="mb-10 sm:mb-14">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h1 className="headline text-[40px] sm:text-[56px]">{title}</h1>
      {children && (
        <p className="mt-3 max-w-2xl text-[17px] leading-snug text-muted sm:text-[21px]">
          {children}
        </p>
      )}
    </header>
  );
}
