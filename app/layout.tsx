import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

// Inter sert de repli là où SF Pro (police système Apple) n'existe pas.
const inter = Inter({
  subsets: ["latin"],
  variable: "--ff-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Couzan-desu — suis tes films, séries et animes",
    template: "%s · Couzan-desu",
  },
  description: "Suis ta progression dans tes films, séries et animes.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Couzan-desu",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f7",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning : certaines extensions de navigateur ajoutent
    // des attributs à <html> avant l'hydratation. Ne concerne que cette balise.
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} flex min-h-dvh flex-col antialiased`}>
        <Providers>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
          {/* Réserve la place de la barre d'onglets mobile */}
          <div className="pb-safe sm:hidden">
            <div className="h-[52px]" />
          </div>
        </Providers>
      </body>
    </html>
  );
}
