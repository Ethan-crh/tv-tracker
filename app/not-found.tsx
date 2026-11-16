import EmptyState from "@/components/EmptyState";

export default function NotFound() {
  return (
    <main className="px-4 py-20">
      <EmptyState
        kana="迷子"
        title="Page introuvable"
        action={{ href: "/recherche", label: "Explorer les titres" }}
      >
        Ce titre n&apos;existe pas, ou plus. Il s&apos;est peut-être perdu entre
        deux cases.
      </EmptyState>
    </main>
  );
}
