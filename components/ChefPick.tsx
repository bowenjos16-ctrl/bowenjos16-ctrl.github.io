"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { ChefHat, Play, X, Quote, Flame } from "lucide-react";
import { CONFIG } from "@/lib/config";
import { useTheme } from "@/components/ThemeProvider";
import type { GalleryItem } from "@/lib/gallery-api";

type Media = GalleryItem;

// Convierte cualquier URL/ID de video (YouTube o Drive) al embed listo para iframe.
// El backend ya hace esto, pero lo dejamos aquí como fallback robusto en cliente.
function toEmbedUrl(src: string): string {
  if (!src) return "";
  const u = src.trim();
  // Drive /file/d/{ID}/...
  let m = u.match(/drive\.google\.com\/file\/d\/([^/?\s]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  // Drive ?id=
  m = u.match(/drive\.google\.com.*[?&]id=([^&\s]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  // YouTube full URL
  m = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^&?\s/]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`;
  // Ya es embed
  if (/youtube\.com\/embed\//.test(u) || /drive\.google\.com\/file\/d\/[^/]+\/preview/.test(u)) {
    return u;
  }
  // ID puro de Drive (25+ chars)
  if (/^[-\w]{25,}$/.test(u)) return `https://drive.google.com/file/d/${u}/preview`;
  // ID corto: asumimos YouTube
  if (/^[-\w]{6,15}$/.test(u)) return `https://www.youtube.com/embed/${u}?autoplay=1`;
  return u;
}

// Fallback estático: se usa cuando el endpoint de Galería falla
const MEDIA_FALLBACK: Media[] = [
  {
    type: "image",
    src: "/dishes/grill-hero.webp",
    title: "Al fuego vivo",
    description: "Cortes premium de res Brangus sellados sobre brasas directas.",
  },
  {
    type: "image",
    src: "/dishes/tigrillo.webp",
    title: "Tigrillo de la mañana",
    description: "Plátano verde majado con chicharrones y huevo.",
  },
  {
    type: "image",
    src: "/dishes/salmon.webp",
    title: "Salmón en salsa de naranja",
    description: "El plato firma del chef — reducción cítrica sobre papas chauchas.",
  },
  {
    type: "image",
    src: "/dishes/ceviche.webp",
    title: "Ceviche fresco",
    description: "Camarón, lima y ají suave con un toque peruano.",
  },
  {
    type: "image",
    src: "/dishes/burgers-pizza.webp",
    title: "Pizza artesanal",
    description: "Masa madre fermentada 24 horas y horneada al momento.",
  },
  {
    type: "image",
    src: "/dishes/cocktails.webp",
    title: "Bar en acción",
    description: "Mojitos, margaritas y sangrías preparadas al momento.",
  },
];

export default function ChefPick() {
  const [open, setOpen] = useState<Media | null>(null);
  const { liveGallery } = useTheme();
  const MEDIA: Media[] = liveGallery?.cocina && liveGallery.cocina.length > 0
    ? liveGallery.cocina
    : MEDIA_FALLBACK;

  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring" }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--red-bright)] to-[var(--red-deep)]"
          >
            <ChefHat className="h-7 w-7 text-white" />
          </motion.div>
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-serif text-xs tracking-[0.5em] text-[var(--red)]/80 uppercase"
          >
            Detrás del fuego
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="red-gradient mt-3 font-serif text-4xl font-black sm:text-5xl"
          >
            Nuestra cocina
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-balance text-sm text-white/65 sm:text-base"
          >
            Un vistazo al arte y la pasión que ponemos en cada plato.
          </motion.p>
        </div>

        {/* Cita del chef */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="red-border mx-auto mb-10 max-w-3xl rounded-3xl p-6 sm:p-8"
        >
          <div className="mb-3 flex items-center gap-2 text-[var(--red)]/80">
            <Quote className="h-4 w-4" />
            <span className="font-serif text-xs tracking-[0.3em] uppercase">
              Del chef
            </span>
          </div>
          <p className="text-balance font-serif text-lg leading-relaxed text-white/85 italic sm:text-xl">
            &ldquo;{CONFIG.chef.bio}&rdquo;
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--red)] to-[var(--red-deep)]">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-serif text-sm font-bold text-white">
                {CONFIG.chef.name}
              </p>
              <p className="text-xs text-white/50">{CONFIG.chef.role}</p>
            </div>
          </div>
        </motion.div>

        {/* Galería masonry */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {MEDIA.map((m, i) => (
            <motion.button
              key={m.title}
              onClick={() => setOpen(m)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className={`group relative overflow-hidden rounded-2xl bg-[var(--charcoal)] ${
                i === 0 || i === 3
                  ? "aspect-[3/4] row-span-2"
                  : "aspect-square"
              }`}
            >
              <Image
                src={m.type === "image" ? m.src : (m.poster || "/dishes/grill-hero.webp")}
                alt={m.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90 transition-opacity group-hover:opacity-95" />

              {m.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all group-hover:bg-[var(--red)]/80">
                    <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
                  </div>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 p-3 text-left sm:p-4">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider text-[var(--red-bright)] uppercase">
                  {m.type === "video" ? (
                    <>
                      <Play className="h-2.5 w-2.5 fill-current" />
                      Video
                    </>
                  ) : (
                    <>
                      <Flame className="h-2.5 w-2.5" />
                      Foto
                    </>
                  )}
                </span>
                <h3 className="mt-1 font-serif text-base font-bold text-white sm:text-lg">
                  {m.title}
                </h3>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Nota de invitación */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center text-xs text-white/40"
        >
          Más contenido próximamente · Síguenos en{" "}
          <a
            href={CONFIG.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--red-bright)] underline underline-offset-4"
          >
            @{CONFIG.instagram}
          </a>
        </motion.p>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black backdrop-blur-md sm:bg-black/95 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex h-full w-full items-center justify-center sm:h-auto sm:max-w-4xl"
            >
              <button
                onClick={() => setOpen(null)}
                className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/80 backdrop-blur hover:bg-white/10 sm:-top-12 sm:right-0 sm:bg-transparent"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>

              {open.type === "image" ? (
                <div className="relative h-[100dvh] w-[100vw] sm:h-auto sm:aspect-[16/10] sm:w-full sm:overflow-hidden sm:rounded-2xl">
                  <Image
                    src={open.src}
                    alt={open.title}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>
              ) : (
                <div className="mx-auto aspect-[9/16] max-h-[100dvh] max-w-[100vw] overflow-hidden bg-black sm:aspect-video sm:max-h-none sm:w-full sm:max-w-4xl sm:rounded-2xl">
                  <iframe
                    src={toEmbedUrl(open.src)}
                    className="h-full w-full"
                    title={open.title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </div>
              )}

              <div className="absolute inset-x-0 bottom-4 px-4 text-left sm:static sm:mt-4">
                <h4 className="font-serif text-xl font-bold text-white drop-shadow-lg sm:text-2xl">
                  {open.title}
                </h4>
                {open.description && (
                  <p className="mt-1 text-sm text-white/80 drop-shadow sm:text-white/60">
                    {open.description}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
