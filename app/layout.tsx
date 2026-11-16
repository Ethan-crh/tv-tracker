import type { Metadata, Viewport } from "next";
import {
  RocknRoll_One,
  Zen_Kaku_Gothic_New,
  IBM_Plex_Mono,
} from "next/font/google";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const display = RocknRoll_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--ff-display",
});

const body = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--ff-body",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--ff-mono",
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
    statusBarStyle: "black-translucent",
    title: "Couzan-desu",
  },
};

export const viewport: Viewport = {
  themeColor: "#E1263F",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} flex min-h-dvh flex-col antialiased`}
      >
        <Providers>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
          {/* Réserve la place de la barre d'onglets mobile */}
          <div className="h-16 bg-ink pb-safe sm:hidden" />
        </Providers>
      </body>
    </html>
  );
}
