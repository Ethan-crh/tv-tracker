"use client";

import { useState, useEffect } from "react";

type Backdrop = {
  backdrop_path: string;
  title: string;
};

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function BackgroundCarousel() {
  const [backdrops, setBackdrops] = useState<Backdrop[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/backdrops");
      const data = await res.json();
      setBackdrops(shuffle(data.backdrops || []));
    }
    load();
  }, []);

  useEffect(() => {
    if (backdrops.length === 0) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % backdrops.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [backdrops]);

  if (backdrops.length === 0) return null;

  const current = backdrops[index];

  return (
    <div className="absolute inset-0 -z-20 overflow-hidden">
      {backdrops.map((item, i) => (
        <div
          key={item.backdrop_path}
          className="absolute inset-0 bg-cover bg-[center_25%] transition-opacity duration-[1500ms] ease-in-out sm:bg-center"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/w1280${item.backdrop_path})`,
            opacity: i === index ? 1 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[#F7F5F0]/55" />
      <div className="halftone-overlay absolute inset-0 opacity-30" />

      {current?.title && (
        <span className="manga-panel absolute left-3 top-3 z-10 max-w-[70%] rotate-[-1deg] bg-[#FFD400] px-2.5 py-1 font-mono-utility text-[10px] font-bold uppercase tracking-wide text-[#111111] sm:left-6 sm:top-6 sm:px-3 sm:text-xs">
          {current.title}
        </span>
      )}
    </div>
  );
}