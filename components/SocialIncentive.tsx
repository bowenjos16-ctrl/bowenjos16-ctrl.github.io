"use client";

import { motion } from "framer-motion";
import { Instagram, Sparkles, ArrowRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { CONFIG } from "@/lib/config";
import { loadSession, apiAwardInstagramBonus } from "@/lib/loyalty";

export default function SocialIncentive() {
  const [loading, setLoading] = useState(false);
  const [awarded, setAwarded] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const session = loadSession();
    if (!session) {
      window.open(CONFIG.instagramUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setLoading(true);
    try {
      const res = await apiAwardInstagramBonus(session.client.telefono);
      if (res.ok || res.alreadyClaimed) {
        setAwarded(true);
      }
    } catch (err) {
      console.error("Failed to award Instagram bonus:", err);
    } finally {
      setLoading(false);
      window.open(CONFIG.instagramUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-4xl px-6">
        <motion.a
          href={CONFIG.instagramUrl}
          target="_blank"
          rel="noreferrer"
          onClick={handleClick}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          whileHover={{ y: -4 }}
          className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-[#833AB4]/40 via-[#E1306C]/40 to-[#F77737]/30 p-8 text-center backdrop-blur sm:p-12"
        >
          <div className="absolute inset-0 bg-[url('/effects/particles.webp')] bg-cover opacity-20" />
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]"
            >
              <Instagram className="h-8 w-8 text-white" />
            </motion.div>

            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Regalo por seguirnos
            </p>

            <h2 className="red-gradient mt-4 font-serif text-4xl font-black sm:text-5xl">
              Síguenos y gana
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-balance text-[var(--foreground)]/80">
              Muestra que nos sigues en{" "}
              <span className="font-bold text-white">@{CONFIG.instagram}</span>{" "}
              y gana{" "}
              <span className="font-bold text-[white]">100 puntos</span>{" "}
              en tu cuenta de loyalidad.
            </p>
            <p className="mt-2 text-xs text-white/50">
              Inicia sesión para acumular los puntos · 1 vez por persona
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold tracking-widest text-[#833AB4] uppercase transition-transform group-hover:scale-105">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Acreditando...
                </>
              ) : awarded ? (
                <>
                  <Check className="h-4 w-4" />
                  ¡Bonus agregado!
                </>
              ) : (
                <>
                  Seguir en Instagram
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </div>
          </div>
        </motion.a>
      </div>
    </section>
  );
}
