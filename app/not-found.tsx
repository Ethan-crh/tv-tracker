import EmptyState from "@/components/EmptyState";
import { SearchIcon } from "@/components/Icons";

export default function NotFound() {
  return (
    <main className="px-4 py-24">
      <EmptyState
        icon={<SearchIcon size={26} />}
        title="Page introuvable"
        action={{ href: "/recherche", label: "Explorer les titres" }}
      >
        Ce titre n&apos;existe pas, ou plus.
      </EmptyState>
    </main>
  );
}
