"use client";

import { motion } from "framer-motion";
import { Lock, Gamepad2, Star } from "lucide-react";
import { useLoyalty } from "./LoyaltyProvider";
import GameZone from "./GameZone";

export default function GameGate() {
  const { isLoggedIn, openModal } = useLoyalty();

  if (isLoggedIn) return <GameZone />;

  return (
    <section id="juegos" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-10 text-center">
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
            Zona de diversión
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="red-gradient mt-3 font-serif text-4xl font-black sm:text-5xl"
          >
            Juegos con premio
          </motion.h2>
        </div>

        {/* Card de bloqueo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="red-border relative overflow-hidden rounded-3xl p-6 text-center sm:p-10"
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--red-rgb),0.3),transparent_60%)]" />
          </div>

          <div className="relative">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--red)]/15 ring-1 ring-[var(--red)]/40"
            >
              <Lock className="h-7 w-7 text-[var(--red-bright)]" />
            </motion.div>

            <h3 className="font-serif text-2xl font-bold text-white sm:text-3xl">
              Juegos bloqueados
            </h3>
            <p className="mx-auto mt-3 max-w-md text-balance text-sm text-white/65 sm:text-base">
              Para jugar y ganar cupones, <strong>inicia sesión</strong> o
              crea tu cuenta de fidelización Corte Piedra.
            </p>

            <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
              {[
                { label: "Trivia", prize: "10% OFF" },
                { label: "Memorama", prize: "5% OFF" },
                { label: "Rasca y gana", prize: "Hasta 20%" },
              ].map((g) => (
                <div
                  key={g.label}
                  className="relative rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center opacity-70"
                >
                  <Lock className="mx-auto mb-1.5 h-3 w-3 text-white/30" />
                  <p className="text-[10px] font-bold tracking-wider text-white uppercase">
                    {g.label}
                  </p>
                  <p className="mt-0.5 text-[9px] text-[var(--red)]/70">
                    {g.prize}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={openModal}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--red)] px-8 py-3.5 text-sm font-bold tracking-widest text-white uppercase shadow-lg shadow-[var(--red)]/30 transition-all hover:scale-105 hover:bg-[var(--red-bright)]"
            >
              <Star className="h-4 w-4 fill-current" />
              Iniciar sesión para jugar
            </button>

            <p className="mt-4 text-[10px] text-white/40">
              Registrarse es gratis · Ganas 50 pts por cada visita
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
