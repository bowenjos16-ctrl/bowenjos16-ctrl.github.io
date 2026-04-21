"use client";

import Image from "next/image";

type Props = {
  variant?: "white" | "stacked" | "stacked-green" | "flame" | "flame-green";
  className?: string;
  width?: number;
  priority?: boolean;
};

const META = {
  white: { src: "/brand/logo-white.webp", w: 1313, h: 531 },
  stacked: { src: "/brand/logo-stacked.webp", w: 900, h: 1013 },
  "stacked-green": { src: "/brand/logo-stacked-green.webp", w: 900, h: 1013 },
  flame: { src: "/brand/flame-red.webp", w: 513, h: 1114 },
  "flame-green": { src: "/brand/flame-green.webp", w: 513, h: 1114 },
};

export default function Logo({
  variant = "white",
  className = "",
  width = 320,
  priority = false,
}: Props) {
  const { src, w, h } = META[variant];
  const height = Math.round((width * h) / w);
  return (
    <Image
      src={src}
      alt="Corte Piedra — Experiencia Gourmet en Cada Bocado"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
