"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Star, Send, Check, Loader2, ExternalLink, Instagram } from "lucide-react";
import { CONFIG } from "@/lib/config";
import { loadSession, apiAwardInstagramBonus, apiAwardGoogleReviewBonus } from "@/lib/loyalty";

const STORAGE_KEY = "cp-rating";

export default function RatingSystem() {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectGoogle, setRedirectGoogle] = useState(false);
  const [instagramAwardLoading, setInstagramAwardLoading] = useState(false);
  const [instagramAwarded, setInstagramAwarded] = useState(false);
  const [googleAwarded, setGoogleAwarded] = useState(false);

  const submit = async () => {
    if (stars === 0) return;
    setSending(true);
    setError(null);

    const payload = {
      stars,
      comment: comment.trim(),
      name: name.trim() || "Anónimo",
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    try {
      if (CONFIG.ratingEndpoint) {
        await fetch(CONFIG.ratingEndpoint, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSent(true);
      // Si es positivo (>= 4 estrellas), invita a reseñar en Google Maps
      if (stars >= 4) setRedirectGoogle(true);
    } catch (e) {
      setError("No se pudo enviar. Intenta de nuevo en un momento.");
    } finally {
      setSending(false);
    }
  };

  const handleGoogleReviewClick = async () => {
    const session = loadSession();
    // Open Google review page regardless of login state
    window.open(CONFIG.googleReviewUrl, "_blank", "noopener,noreferrer");
    if (!session || googleAwarded) return;
    try {
      const res = await apiAwardGoogleReviewBonus(session.client.telefono);
      if (res.ok || res.alreadyClaimed) setGoogleAwarded(true);
    } catch (err) {
      console.error("Failed to award Google review bonus:", err);
    }
  };

  const handleInstagramClick = async () => {
    const session = loadSession();
    if (!session) {
      // No logged in, just open Instagram
      window.open(CONFIG.instagramUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // User is logged in, try to award bonus points
    setInstagramAwardLoading(true);
    try {
      const res = await apiAwardInstagramBonus(session.client.telefono);
      if (res.ok) {
        setInstagramAwarded(true);
        // Open Instagram
        window.open(CONFIG.instagramUrl, "_blank", "noopener,noreferrer");
      } else if (res.alreadyClaimed) {
        // Already used the bonus
        setInstagramAwarded(true);
        window.open(CONFIG.instagramUrl, "_blank", "noopener,noreferrer");
      } else {
        // Error awarding points, but still open Instagram
        console.error("Error awarding Instagram bonus:", res.error);
        window.open(CONFIG.instagramUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Failed to award Instagram bonus:", err);
      // Still open Instagram even if award failed
      window.open(CONFIG.instagramUrl, "_blank", "noopener,noreferrer");
    } finally {
      setInstagramAwardLoading(false);
    }
  };

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="red-border overflow-hidden rounded-3xl p-8 sm:p-12"
        >
          <div className="mb-8 text-center">
            <p className="font-serif text-xs tracking-[0.5em] text-[var(--red)]/80 uppercase">
              Tu opinión importa
            </p>
            <h2 className="red-gradient mt-3 font-serif text-4xl font-black sm:text-5xl">
              Califica tu experiencia
            </h2>
            <p className="mt-3 text-[var(--foreground)]/60">
              Nos ayuda a mejorar y a que más comensales nos descubran.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="mb-6 flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <motion.button
                      key={s}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => setHover(s)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setStars(s)}
                      aria-label={`${s} estrella${s > 1 ? "s" : ""}`}
                      className="transition-colors"
                    >
                      <Star
                        className={`h-10 w-10 transition-all sm:h-12 sm:w-12 ${
                          s <= (hover || stars)
                            ? "fill-[white] text-[white] drop-shadow-[0_0_12px_rgba(232,200,122,0.6)]"
                            : "text-[var(--foreground)]/20"
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
                <p className="mb-6 text-center font-serif text-sm tracking-widest text-[var(--red)]/80 uppercase">
                  {stars === 0 && "Elige tu calificación"}
                  {stars === 1 && "Lo sentimos 😔"}
                  {stars === 2 && "Podemos mejorar"}
                  {stars === 3 && "Gracias 🙂"}
                  {stars === 4 && "¡Nos alegra! ✨"}
                  {stars === 5 && "¡Increíble! 🔥"}
                </p>

                <div className="space-y-4">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre (opcional)"
                    className="w-full rounded-xl border border-[var(--red)]/20 bg-[var(--charcoal)]/50 px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 focus:border-[var(--red)]/50 focus:outline-none"
                  />
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="Cuéntanos tu experiencia..."
                    className="w-full resize-none rounded-xl border border-[var(--red)]/20 bg-[var(--charcoal)]/50 px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 focus:border-[var(--red)]/50 focus:outline-none"
                  />
                  <button
                    onClick={submit}
                    disabled={stars === 0 || sending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[white] to-[var(--red)] px-6 py-4 font-bold tracking-widest text-[var(--background)] uppercase shadow-lg shadow-[var(--red)]/30 transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar calificación
                      </>
                    )}
                  </button>
                  {error && (
                    <p className="text-center text-sm text-[var(--ember)]">
                      {error}
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[white] to-[var(--red)]"
                >
                  <Check className="h-10 w-10 text-[var(--background)]" />
                </motion.div>
                <h3 className="red-gradient font-serif text-3xl font-black">
                  ¡Gracias {name || "por tu tiempo"}!
                </h3>
                <p className="mt-3 text-[var(--foreground)]/70">
                  Tu calificación fue registrada.
                </p>
                {redirectGoogle && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 space-y-4 rounded-2xl border border-[var(--red)]/30 bg-[var(--red)]/5 p-6"
                  >
                    <div>
                      <p className="text-sm text-[var(--foreground)]/80">
                        Nos encantaría que también la dejaras pública en Google.
                        Nos ayuda a llegar a más comensales.
                      </p>
                      {loadSession() && (
                        <p className="mt-2 text-sm text-[var(--foreground)]/80">
                          Deja una reseña en Google y gana{" "}
                          <span className="font-bold text-[var(--red)]">100 puntos</span>{" "}
                          en tu cuenta de loyalidad.
                        </p>
                      )}
                      <button
                        onClick={handleGoogleReviewClick}
                        disabled={googleAwarded}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#4285F4] px-6 py-3 text-sm font-bold tracking-wider text-white uppercase transition-transform hover:scale-105 disabled:opacity-60"
                      >
                        {googleAwarded ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Bonus agregado
                          </>
                        ) : (
                          <>
                            Dejar reseña en Google
                            <ExternalLink className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>

                    {loadSession() && (
                      <div className="border-t border-[var(--red)]/20 pt-4">
                        <p className="text-sm text-[var(--foreground)]/80">
                          Síguenos en Instagram y gana <span className="font-bold text-[var(--red)]">100 puntos</span> en tu cuenta de loyalidad.
                        </p>
                        <button
                          onClick={handleInstagramClick}
                          disabled={instagramAwardLoading || instagramAwarded}
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#dc2743] px-6 py-3 text-sm font-bold tracking-wider text-white uppercase transition-transform hover:scale-105 disabled:opacity-60"
                        >
                          {instagramAwardLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Abriendo...
                            </>
                          ) : instagramAwarded ? (
                            <>
                              <Check className="h-4 w-4" />
                              Bonus agregado
                            </>
                          ) : (
                            <>
                              <Instagram className="h-4 w-4" />
                              Seguir en Instagram
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
