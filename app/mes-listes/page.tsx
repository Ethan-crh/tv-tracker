import type { Metadata } from "next";
import LibraryView from "@/components/LibraryView";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "Mes listes" };

export default function MesListesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader eyebrow="Ma bibliothèque" title="Mes listes">
        Tout ce que tu suis, classé par statut, avec ta progression épisode
        par épisode.
      </PageHeader>
      <LibraryView />
    </main>
  );
}
