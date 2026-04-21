"use client";

import { useEffect, useRef, useState } from "react";
import { CONFIG } from "@/lib/config";

const KEN_BURNS_IMAGES = [
  "/dishes/grill-hero.webp",
  "/dishes/cocktails.webp",
  "/dishes/ceviche.webp",
  "/dishes/burgers-pizza.webp",
];

export default function HeroVideo() {
  const [idx, setIdx] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const hasVideo = !!CONFIG.heroVideoId;

  useEffect(() => {
    if (hasVideo) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % KEN_BURNS_IMAGES.length);
    }, 6000);
    return () => clearInterval(id);
  }, [hasVideo]);

  if (hasVideo) {
    const start = CONFIG.heroVideoStart ?? 0;
    const end = CONFIG.heroVideoEnd ?? 20;
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      loop: "1",
      playlist: CONFIG.heroVideoId,
      controls: "0",
      modestbranding: "1",
      showinfo: "0",
      rel: "0",
      iv_load_policy: "3",
      playsinline: "1",
      disablekb: "1",
      start: String(start),
      end: String(end),
      enablejsapi: "1",
    });
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <iframe
          ref={iframeRef}
          className="pointer-events-none absolute top-1/2 left-1/2 h-[150vh] w-[280vw] -translate-x-1/2 -translate-y-1/2 md:h-[180%] md:w-[180%]"
          src={`https://www.youtube.com/embed/${CONFIG.heroVideoId}?${params.toString()}`}
          title="Piñas, El Oro — Ecuador"
          allow="autoplay; encrypted-media; picture-in-picture"
          frameBorder={0}
          loading="eager"
        />
        {/* Overlay mínimo — dejar que se vea el video */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.75)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.9)_100%)]" />
    </div>
  );
}
