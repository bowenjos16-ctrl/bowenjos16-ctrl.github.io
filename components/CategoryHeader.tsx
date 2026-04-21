"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTheme } from "./ThemeProvider";

export default function CategoryHeader({
  title,
  tagline,
}: {
  title: string;
  tagline: string;
}) {
  const { menuKind } = useTheme();
  const flameSrc =
    menuKind === "tradicional" ? "/brand/flame-green.webp" : "/brand/flame-red.webp";
  return (
    <div className="mb-14 flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="relative mb-6 h-16 w-16 flame-flicker"
      >
        <Image
          src={flameSrc}
          alt=""
          fill
          className="object-contain drop-shadow-[0_0_15px_rgba(var(--red-rgb),0.5)]"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex items-center gap-4"
      >
        <span className="red-rule" />
        <span className="font-sans text-xs font-bold tracking-[0.4em] text-[var(--red)] uppercase">
          Menú
        </span>
        <span className="red-rule" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-4 font-serif text-5xl font-black tracking-tight text-white sm:text-6xl"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-3 font-serif text-sm tracking-[0.2em] text-[var(--red)]/90 italic uppercase"
      >
        {tagline}
      </motion.p>
    </div>
  );
}
