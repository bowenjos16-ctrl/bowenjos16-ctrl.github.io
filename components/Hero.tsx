"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import HeroVideo from "./HeroVideo";
import Logo from "./Logo";
import { CONFIG } from "@/lib/config";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      <HeroVideo />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-96">
        <motion.div
          animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,32,46,0.2),transparent_60%)] blur-2xl"
        />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 text-center"
      >
        {/* Título decorativo tipo portada */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="mb-6 flex items-center gap-4"
        >
          <span className="red-rule" />
          <span className="font-serif text-xs tracking-[0.5em] text-white/60 uppercase">
            Est. {CONFIG.established}
          </span>
          <span className="red-rule" />
        </motion.div>

        {/* Logo stacked (llama + texto) con flicker en la llama */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          className="flame-flicker drop-shadow-[0_0_30px_rgba(200,32,46,0.3)]"
        >
          <Logo
            variant="stacked"
            width={420}
            priority
            className="h-auto w-[min(78vw,420px)]"
          />
        </motion.div>

        {/* Tagline rojo — como aparece en el menú original */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-6 font-serif text-xl text-[var(--red)] italic sm:text-2xl"
        >
          Experiencia <span className="italic">Gourmet</span> en Cada{" "}
          <span className="italic">Bocado</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="mt-6 max-w-2xl text-balance font-serif text-base text-white/70 italic sm:text-lg"
        >
          {CONFIG.tagline}. Cortes premium, mariscos frescos y la pasión de una
          buena mesa desde junio de {CONFIG.established}.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="mt-3 flex items-center gap-2 text-xs tracking-widest text-white/60 uppercase"
        >
          <MapPin className="h-3 w-3 text-[var(--red)]" />
          {CONFIG.city}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="mt-12 flex flex-col items-center gap-6 sm:flex-row"
        >
          <a
            href="#menu"
            className="group relative overflow-hidden rounded-full bg-[var(--red)] px-10 py-4 font-sans text-sm font-bold tracking-[0.2em] text-white uppercase transition-all hover:bg-[var(--red-bright)]"
          >
            <span className="relative z-10">Ver la carta</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          </a>
          <a
            href="#eventos"
            className="font-sans text-sm font-semibold tracking-[0.2em] text-white/70 uppercase transition-colors hover:text-white"
          >
            Eventos en vivo →
          </a>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mt-16 text-white/40"
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
    </section>
  );
}
