import type { Metadata } from "next";
import { RocknRoll_One, Zen_Kaku_Gothic_New, IBM_Plex_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const display = RocknRoll_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Couzan-desu",
  description: "Suis ta progression dans tes films, séries et animes.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
      >
        <Navbar />
        <div className="pb-16 sm:pb-0">{children}</div>
      </body>
    </html>
  );
}