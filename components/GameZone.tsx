"use client";

import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import Trivia from "./games/Trivia";
import Memory from "./games/Memory";
import Scratch from "./games/Scratch";

export default function GameZone() {
  return (
    <section id="juegos" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring" }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ember)] to-[var(--red-bright)]"
          >
            <Gamepad2 className="h-7 w-7 text-white" />
          </motion.div>
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-serif text-xs tracking-[0.5em] text-[var(--red)]/80 uppercase"
          >
            Mientras esperas tu plato
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="red-gradient mt-3 font-serif text-4xl font-black sm:text-5xl"
          >
            Zona de diversión
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-[var(--foreground)]/60"
          >
            3 minijuegos. Cada uno tiene premio en WhatsApp.
          </motion.p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0, duration: 0.6 }}
          >
            <Trivia />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            <Memory />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Scratch />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
