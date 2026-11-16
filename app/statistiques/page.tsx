import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import StatsView from "@/components/StatsView";

export const metadata: Metadata = { title: "Statistiques" };

export default function StatistiquesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <PageHeader eyebrow="Mon bilan" title="Mes statistiques">
        Ce que tu as regardé, en chiffres.
      </PageHeader>
      <StatsView />
    </main>
  );
}
