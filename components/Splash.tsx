"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import Logo from "./Logo";
import { CONFIG, waLink } from "@/lib/config";

const TOP_PICKS = [
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

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-black"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,32,46,0.15),transparent_55%)]" />
        </div>

        <div className="relative z-10 w-full max-w-6xl px-6 py-10 text-center">
          {/* "Menú" en script + líneas rojas — como la portada del PDF */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-2 flex items-center justify-center gap-4"
          >
            <span className="red-rule" />
            <span className="font-serif text-4xl text-white italic sm:text-5xl">
              Menú
            </span>
            <span className="red-rule" />
          </motion.div>

          {/* Logo apilado flamma+texto */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto mt-6 flex justify-center flame-flicker drop-shadow-[0_0_30px_rgba(200,32,46,0.3)]"
          >
            <Logo variant="stacked" width={280} priority className="h-auto w-[min(70vw,280px)]" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-6 font-serif text-lg text-[var(--red)] italic sm:text-xl"
          >
            Experiencia <span className="italic">Gourmet</span> en Cada{" "}
            <span className="italic">Bocado</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="mx-auto mt-6 max-w-xl text-balance text-sm leading-relaxed text-white/70 sm:text-base"
          >
            Gracias por visitarnos. Te presentamos nuestros platos más queridos —
            seleccionados por los clientes que llenan nuestras mesas cada noche.
          </motion.p>

          {/* TOP 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="mt-10"
          >
            <div className="mb-5 flex items-center justify-center gap-3 text-[var(--red)]">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-sans text-xs font-bold tracking-[0.4em] uppercase">
                Top 3 recomendados
              </span>
              <Star className="h-4 w-4 fill-current" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {TOP_PICKS.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8 + i * 0.15, duration: 0.8 }}
                  whileHover={{ y: -6 }}
                  className="group red-border card-hover relative overflow-hidden rounded-2xl text-left"
                >
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <span className="tag-badge absolute top-3 right-3 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase">
                      {p.badge}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="font-serif text-xl font-bold text-white">
                        {p.name}
                      </h3>
                      <p className="mt-1 text-xs text-white/70">{p.tagline}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <span className="price-tag text-xl">${p.price}</span>
                    <a
                      href={waLink(p.name, p.price)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#1ea855]"
                    >
                      Pedir
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.6, duration: 0.8 }}
            onClick={onClose}
            className="mt-10 rounded-full bg-[var(--red)] px-10 py-4 font-sans text-sm font-bold tracking-[0.3em] text-white uppercase shadow-lg shadow-red-900/40 transition-all hover:bg-[var(--red-bright)]"
          >
            Explorar el menú
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8, duration: 0.8 }}
            onClick={onClose}
            className="ml-4 mt-10 font-sans text-xs tracking-widest text-white/40 uppercase transition-colors hover:text-white/80"
          >
            Saltar
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
