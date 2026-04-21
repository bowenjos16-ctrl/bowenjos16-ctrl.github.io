"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Instagram,
  Camera,
} from "lucide-react";
import { CONFIG, waGeneralLink } from "@/lib/config";

const IMAGES = [
  { src: "/customers/client-3.webp", caption: "Cenas con velas" },
  { src: "/customers/client-2.webp", caption: "Entre amigos" },
  { src: "/customers/client-4.webp", caption: "Celebrando momentos" },
  { src: "/customers/client-1.webp", caption: "Ambiente Corte Piedra" },
  { src: "/customers/client-5.webp", caption: "Sobremesa con copas" },
  { src: "/customers/client-8.webp", caption: "Noches que quedan" },
  { src: "/customers/client-6.webp", caption: "Reuniones especiales" },
  { src: "/customers/client-9.webp", caption: "Buena mesa" },
];

export default function Gallery() {
  const [active, setActive] = useState<number | null>(null);

  const prev = () =>
    setActive((i) =>
      i === null ? null : (i - 1 + IMAGES.length) % IMAGES.length,
    );
  const next = () =>
    setActive((i) => (i === null ? null : (i + 1) % IMAGES.length));

  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring" }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--red-bright)] to-[var(--red-deep)]"
          >
            <Heart className="h-6 w-6 fill-white text-white" />
          </motion.div>
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-serif text-xs tracking-[0.5em] text-[var(--red)]/80 uppercase"
          >
            Nuestros clientes
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="red-gradient mt-3 font-serif text-4xl font-black sm:text-5xl"
          >
            Momentos compartidos
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mx-auto mt-3 max-w-xl text-balance text-sm text-white/65 sm:text-base"
          >
            Cada plato nace alrededor de una buena mesa. Así disfrutan nuestros
            comensales la experiencia Corte Piedra.
          </motion.p>
        </div>

        {/* Masonry grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
          {IMAGES.map((img, i) => (
            <motion.button
              key={img.src}
              onClick={() => setActive(i)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.04, duration: 0.5 }}
              whileHover={{ y: -3 }}
              className={`group relative overflow-hidden rounded-xl bg-[var(--charcoal)] ${
                i % 5 === 0
                  ? "aspect-[3/4] row-span-2"
                  : i % 3 === 0
                    ? "aspect-square"
                    : "aspect-[4/5]"
              }`}
            >
              <Image
                src={img.src}
                alt={img.caption}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                <p className="font-serif text-sm font-medium text-white sm:text-base">
                  {img.caption}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* CTA Compartir tu momento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#833AB4]/30 via-[#E1306C]/25 to-[var(--red)]/30 p-6 text-center sm:p-8"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            Comparte tu momento
          </h3>
          <p className="mx-auto mt-2 max-w-md text-balance text-sm text-white/80">
            Tómate una foto en tu próxima visita y etiqueta a{" "}
            <span className="font-bold text-white">@{CONFIG.instagram}</span>.
            La subimos aquí como parte de nuestra historia.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={CONFIG.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold tracking-widest text-[#833AB4] uppercase"
            >
              <Instagram className="h-4 w-4" />
              Seguir en IG
            </a>
            <a
              href={waGeneralLink(
                "Hola Corte Piedra 👋 Quiero compartir una foto de mi visita.",
              )}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-xs font-bold tracking-widest text-white uppercase"
            >
              Enviar por WhatsApp
            </a>
          </div>
        </motion.div>
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
              className="absolute left-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-6"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <motion.div
              key={active}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[85vh] w-full max-w-4xl"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={IMAGES[active].src}
                  alt={IMAGES[active].caption}
                  fill
                  className="rounded-xl object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
              <p className="mt-3 text-center font-serif text-base text-white italic sm:text-lg">
                {IMAGES[active].caption}
              </p>
            </motion.div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-6"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActive(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
