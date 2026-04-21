"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import HeroVideo from "./HeroVideo";
import Logo from "./Logo";
import { useTheme } from "./ThemeProvider";
import { CONFIG } from "@/lib/config";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { menuKind } = useTheme();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden py-12"
    >
      <HeroVideo />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 sm:h-96">
        <motion.div
          animate={{ opacity: [0.2, 0.45, 0.2], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,32,46,0.25),transparent_60%)] blur-2xl"
        />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 text-center sm:px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.6 }}
          className="mb-4 flex items-center gap-3 text-white/70 sm:mb-6 sm:gap-4"
        >
          <span className="h-px w-8 bg-[var(--red)] sm:w-12" />
          <span className="font-serif text-[10px] tracking-[0.4em] uppercase sm:text-xs sm:tracking-[0.5em]">
            Est. {CONFIG.established}
          </span>
          <span className="h-px w-8 bg-[var(--red)] sm:w-12" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          className="flame-flicker drop-shadow-[0_0_30px_rgba(var(--red-rgb),0.35)]"
        >
          <Logo
            variant={menuKind === "tradicional" ? "stacked-green" : "stacked"}
            width={420}
            priority
            className="h-auto w-[min(75vw,300px)] sm:w-[min(70vw,380px)] md:w-[420px]"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-4 font-serif text-base text-[var(--red)] italic sm:mt-6 sm:text-xl md:text-2xl"
        >
          Experiencia <span className="italic">Gourmet</span> en Cada{" "}
          <span className="italic">Bocado</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.5 }}
          className="mt-4 max-w-xl text-balance font-serif text-sm text-white/75 italic sm:mt-6 sm:text-base md:text-lg"
        >
          Parrilla & Mariscos. Cortes premium y mariscos frescos desde 2024.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-2 flex items-center gap-2 text-[10px] tracking-widest text-white/60 uppercase sm:mt-3 sm:text-xs"
        >
          <MapPin className="h-3 w-3 text-[var(--red)]" />
          {CONFIG.city}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35, duration: 0.5 }}
          className="mt-8 flex w-full flex-col items-center gap-4 sm:mt-12 sm:flex-row sm:justify-center sm:gap-6"
        >
          <a
            href="#menu"
            className="group relative inline-flex w-full max-w-xs items-center justify-center overflow-hidden rounded-full bg-[var(--red)] px-10 py-4 font-sans text-sm font-bold tracking-[0.2em] text-white uppercase transition-all active:scale-95 hover:bg-[var(--red-bright)] sm:w-auto"
          >
            <span className="relative z-10">Ver la carta</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          </a>
          <a
            href="#eventos"
            className="font-sans text-xs font-semibold tracking-[0.2em] text-white/70 uppercase transition-colors active:text-white sm:text-sm"
          >
            Eventos en vivo →
          </a>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mt-10 text-white/40 sm:mt-16"
        >
          <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6" />
        </motion.div>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent sm:h-32" />
    </section>
  );
}
