"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const IMAGES = [
  { src: "/dishes/grill-hero.webp", caption: "Cortes al fuego vivo" },
  { src: "/dishes/burgers-pizza.webp", caption: "Pizzas y hamburguesas artesanales" },
  { src: "/dishes/ceviche.webp", caption: "Ceviche peruano" },
  { src: "/dishes/salmon.webp", caption: "Salmón en salsa de naranja" },
  { src: "/dishes/micheladas.webp", caption: "Micheladas y frescos" },
  { src: "/dishes/cocktails.webp", caption: "Cócteles del bar" },
];

export default function Gallery() {
  const [active, setActive] = useState<number | null>(null);

  const prev = () =>
    setActive((i) => (i === null ? null : (i - 1 + IMAGES.length) % IMAGES.length));
  const next = () =>
    setActive((i) => (i === null ? null : (i + 1) % IMAGES.length));

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-serif text-xs tracking-[0.5em] text-[var(--red)]/80 uppercase"
          >
            Galería
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="red-gradient mt-3 font-serif text-4xl font-black sm:text-5xl"
          >
            Platos que enamoran
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {IMAGES.map((img, i) => (
            <motion.button
              key={img.src}
              onClick={() => setActive(i)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              whileHover={{ y: -4 }}
              className={`group relative overflow-hidden rounded-2xl bg-[var(--charcoal)] ${
                i === 0 || i === 3 ? "md:row-span-2 md:aspect-[3/5]" : "aspect-square"
              }`}
            >
              <Image
                src={img.src}
                alt={img.caption}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="font-serif text-sm text-[white]">
                  {img.caption}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-4 rounded-full bg-[var(--red)]/10 p-3 text-[white] hover:bg-[var(--red)]/30 sm:left-8"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <motion.div
              key={active}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[85vh] w-full max-w-5xl"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={IMAGES[active].src}
                  alt={IMAGES[active].caption}
                  fill
                  className="rounded-2xl object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
              <p className="mt-4 text-center font-serif text-lg text-[white] italic">
                {IMAGES[active].caption}
              </p>
            </motion.div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-4 rounded-full bg-[var(--red)]/10 p-3 text-[white] hover:bg-[var(--red)]/30 sm:right-8"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <button
              onClick={() => setActive(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white sm:top-8 sm:right-8"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
