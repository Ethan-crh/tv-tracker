"use client";

import { useState, useEffect } from "react";

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function BackgroundCarousel() {
  const [backdrops, setBackdrops] = useState<string[]>([]);
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

  return (
    <div className="absolute inset-0 -z-20 overflow-hidden">
      {backdrops.map((path, i) => (
        <div
          key={path}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/original${path})`,
            opacity: i === index ? 1 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[#F7F5F0]/55" />
      <div className="halftone-overlay absolute inset-0 opacity-30" />
    </div>
  );
}