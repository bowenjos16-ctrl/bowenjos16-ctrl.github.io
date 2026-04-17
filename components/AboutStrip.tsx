"use client";

import { motion } from "framer-motion";

export default function AboutStrip() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mx-auto h-px max-w-xs bg-[var(--red)]"
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-8 text-balance font-serif text-2xl leading-relaxed text-white italic sm:text-3xl"
        >
          &ldquo;En Corte Piedra, cada experiencia nace alrededor de una{" "}
          <span className="text-[var(--red-bright)] font-semibold not-italic">
            buena mesa
          </span>
          .&rdquo;
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-6 text-sm leading-relaxed text-white/60 sm:text-base"
        >
          Desde junio de 2024 ponemos pasión y dedicación en ofrecer cortes
          premium de res y cerdo, celebrando el verdadero sabor de la buena
          cocina. Hoy presentamos nuestra nueva carta, con propuestas que
          enamoran el paladar, desde selectas carnes hasta delicados mariscos.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mx-auto mt-8 h-px max-w-xs bg-[var(--red)]"
        />
      </div>
    </section>
  );
}
