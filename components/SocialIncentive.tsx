"use client";

import { motion } from "framer-motion";
import { Instagram, Sparkles, ArrowRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { CONFIG } from "@/lib/config";
import { apiAwardInstagramBonus } from "@/lib/loyalty";
import { useLoyalty } from "./LoyaltyProvider";

export default function SocialIncentive() {
  // Usamos client del contexto (siempre fresco) en vez de loadSession() que
  // expira a los 60 min y silenciosamente no acreditaba el bonus.
  const { client, isLoggedIn, setClient, refreshClient, openModal } = useLoyalty();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "awarded" | "claimed" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    // Abrimos Instagram INMEDIATAMENTE durante el click (user gesture).
    // Si lo hiciéramos después de un await, el navegador bloquea el popup.
    window.open(CONFIG.instagramUrl, "_blank", "noopener,noreferrer");
    if (!isLoggedIn || !client?.telefono) {
      setStatus("error");
      setErrMsg("Inicia sesión para ganar los 100 puntos.");
      // Abrir modal de loyalty para que el usuario inicie sesión.
      setTimeout(() => openModal(), 600);
      return;
    }
    setLoading(true);
    setErrMsg(null);
    try {
      const res = await apiAwardInstagramBonus(client.telefono);
      if (res.ok && res.pointsAwarded) {
        if (res.client) setClient(res.client);
        else await refreshClient();
        setStatus("awarded");
      } else if (res.alreadyClaimed || res.error === "already_claimed") {
        setStatus("claimed");
      } else {
        setStatus("error");
        setErrMsg(res.error || "No se pudieron acreditar los puntos.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error de red";
      setStatus("error");
      setErrMsg(msg);
    } finally {
      setLoading(false);
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
              ) : status === "awarded" ? (
                <>
                  <Check className="h-4 w-4" />
                  ¡+100 puntos!
                </>
              ) : status === "claimed" ? (
                <>
                  <Check className="h-4 w-4" />
                  Ya reclamado
                </>
              ) : (
                <>
                  Seguir en Instagram
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </div>
            {status === "error" && errMsg && (
              <p className="mt-3 text-xs font-bold text-white/90">{errMsg}</p>
            )}
          </div>
        </motion.a>
      </div>
    </section>
  );
}
