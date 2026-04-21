"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Star, ArrowRight, Sun, Flame } from "lucide-react";
import Image from "next/image";
import Logo from "./Logo";
import { CONFIG, waLink } from "@/lib/config";
import { getMenuKindByHour, MENU_SCHEDULE } from "@/lib/menu-schedule";
import { TOP_PICKS_TRADICIONAL } from "@/lib/menu-tradicional";

const TOP_PICKS_REGULAR = [
  {
    name: "Tomahawk",
    price: "16.00",
    image: "/dishes/grill-hero.webp",
    badge: "Más vendido",
    tagline: "Corte premium de res Brangus",
  },
  {
    name: "Carrusel de mariscos",
    price: "24.00",
    image: "/dishes/ceviche.webp",
    badge: "Ideal compartir",
    tagline: "Ceviche · arroz marinero · chicharrones",
  },
  {
    name: "Picadita Corte Piedra Mixta",
    price: "24.00",
    image: "/dishes/burgers-pizza.webp",
    badge: "Favorito",
    tagline: "Parrillada completa con mariscos",
  },
];

export default function Splash({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [kind, setKind] = useState<"tradicional" | "regular">("regular");

  useEffect(() => {
    setMounted(true);
    setKind(getMenuKindByHour(new Date().getHours()));
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevOverflow;
    };
  }, []);

  if (!mounted) return null;

  const TOP_PICKS =
    kind === "tradicional" ? TOP_PICKS_TRADICIONAL : TOP_PICKS_REGULAR;
  const info = MENU_SCHEDULE[kind];
  const MenuIcon = kind === "tradicional" ? Sun : Flame;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-[100] flex flex-col bg-black overflow-y-auto overscroll-contain"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Fondo radial rojo sutil */}
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(200,32,46,0.18),transparent_60%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 py-6 text-center sm:px-6 sm:py-10">
          {/* "Menú" título con líneas rojas */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex items-center justify-center gap-3 sm:gap-4"
          >
            <span className="h-px w-10 bg-[var(--red)] sm:w-16" />
            <span className="font-serif text-3xl text-white italic sm:text-5xl">
              Menú
            </span>
            <span className="h-px w-10 bg-[var(--red)] sm:w-16" />
          </motion.div>

          {/* Logo stacked flame + texto */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="mt-4 flex justify-center flame-flicker drop-shadow-[0_0_24px_rgba(200,32,46,0.3)] sm:mt-6"
          >
            <Logo
              variant="stacked"
              width={260}
              priority
              className="h-auto w-[min(60vw,220px)] sm:w-[min(70vw,260px)]"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-4 font-serif text-base text-[var(--red)] italic sm:mt-6 sm:text-xl"
          >
            Experiencia <span className="italic">Gourmet</span> en Cada{" "}
            <span className="italic">Bocado</span>
          </motion.p>

          {/* Badge del horario activo */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.78, duration: 0.5 }}
            className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--red)]/40 bg-[var(--red)]/10 px-4 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase sm:text-xs"
          >
            <MenuIcon className="h-3.5 w-3.5 text-[var(--red)]" />
            <span>
              Ahora · {info.label}
              <span className="ml-1.5 text-white/60">
                · {info.scheduleLabel}
              </span>
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.5 }}
            className="mx-auto mt-4 max-w-md text-balance text-xs leading-relaxed text-white/70 sm:mt-6 sm:max-w-xl sm:text-base"
          >
            Gracias por visitarnos. Te presentamos nuestros platos más queridos —
            seleccionados por los clientes que llenan nuestras mesas cada noche.
          </motion.p>

          {/* TOP 3 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="mt-6 w-full sm:mt-10"
          >
            <div className="mb-4 flex items-center justify-center gap-2 text-[var(--red)] sm:mb-5 sm:gap-3">
              <Star className="h-3 w-3 fill-current sm:h-4 sm:w-4" />
              <span className="font-sans text-[10px] font-bold tracking-[0.3em] uppercase sm:text-xs sm:tracking-[0.4em]">
                Top 3 recomendados
              </span>
              <Star className="h-3 w-3 fill-current sm:h-4 sm:w-4" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              {TOP_PICKS.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.15 + i * 0.1, duration: 0.5 }}
                  className="group red-border relative overflow-hidden rounded-2xl text-left"
                >
                  <div className="relative h-36 overflow-hidden sm:h-44">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <span className="tag-badge absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase sm:top-3 sm:right-3 sm:px-3 sm:py-1 sm:text-[10px]">
                      {p.badge}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                      <h3 className="font-serif text-base font-bold text-white sm:text-xl">
                        {p.name}
                      </h3>
                      <p className="mt-0.5 text-[10px] text-white/70 sm:mt-1 sm:text-xs">
                        {p.tagline}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4">
                    <span className="price-tag text-lg sm:text-xl">${p.price}</span>
                    <a
                      href={waLink(p.name, p.price)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-3 py-1.5 text-[11px] font-semibold text-white sm:text-xs"
                    >
                      Pedir
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.5 }}
            className="mt-6 flex w-full flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4"
          >
            <button
              onClick={onClose}
              className="w-full max-w-xs rounded-full bg-[var(--red)] px-8 py-4 font-sans text-sm font-bold tracking-[0.25em] text-white uppercase shadow-lg shadow-red-900/40 transition-all active:scale-95 sm:w-auto sm:px-10 sm:tracking-[0.3em]"
            >
              Explorar el menú
            </button>
            <button
              onClick={onClose}
              className="font-sans text-xs tracking-widest text-white/50 uppercase transition-colors active:text-white"
            >
              Saltar
            </button>
          </motion.div>

          <div className="h-6 sm:h-10" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
