"use client";

import { useEffect, useState } from "react";
import { CONFIG } from "@/lib/config";

const KEN_BURNS_IMAGES = [
  "/dishes/grill-hero.webp",
  "/dishes/cocktails.webp",
  "/dishes/ceviche.webp",
  "/dishes/burgers-pizza.webp",
];

export default function HeroVideo() {
  const [idx, setIdx] = useState(0);
  const hasVideo = !!CONFIG.heroVideoId;

  useEffect(() => {
    if (hasVideo) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % KEN_BURNS_IMAGES.length);
    }, 6000);
    return () => clearInterval(id);
  }, [hasVideo]);

  if (hasVideo) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <iframe
          className="absolute top-1/2 left-1/2 h-[120vh] w-[220vw] -translate-x-1/2 -translate-y-1/2 md:h-[130%] md:w-[130%]"
          src={`https://www.youtube.com/embed/${CONFIG.heroVideoId}?autoplay=1&mute=1&loop=1&playlist=${CONFIG.heroVideoId}&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&disablekb=1`}
          title="Piñas, El Oro — Ecuador"
          allow="autoplay; encrypted-media; picture-in-picture"
          frameBorder={0}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/70 via-[var(--background)]/50 to-[var(--background)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,4,3,0.85)_100%)]" />
      </div>
    );
  }

  // Ken Burns fallback
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {KEN_BURNS_IMAGES.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-[2000ms] ${
            i === idx ? "opacity-40" : "opacity-0"
          }`}
        >
          <div
            className="ken-burns absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${src})` }}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/75 via-[var(--background)]/60 to-[var(--background)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(10,4,3,0.9)_100%)]" />
    </div>
  );
}
