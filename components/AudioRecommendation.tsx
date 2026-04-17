"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Volume2, Pause, Play, Headphones } from "lucide-react";

const SCRIPT = `Bienvenido a Corte Piedra.
Nuestra recomendación de la noche: empezamos con Tuétano con camarón y pan de ajo, nuestro entrante firma por ocho dólares.
De plato fuerte te sugerimos el Tomahawk, un corte premium de res Brangus por dieciséis dólares, o para compartir, el Carrusel de mariscos por veinticuatro dólares con ceviche peruano, arroz marinero y chicharrones.
Acompáñalo con una copa de Casillero Cabernet. Para el postre, nuestros milkshakes son el cierre perfecto.
Buen provecho.`;

export default function AudioRecommendation() {
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(true);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggle = () => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    if (playing) {
      synth.cancel();
      setPlaying(false);
      return;
    }
    const utt = new SpeechSynthesisUtterance(SCRIPT);
    utt.lang = "es-ES";
    utt.rate = 0.95;
    utt.pitch = 1.05;

    // Pick Spanish voice if available
    const voices = synth.getVoices();
    const esVoice =
      voices.find((v) => v.lang.startsWith("es") && v.name.includes("Mónica")) ||
      voices.find((v) => v.lang.startsWith("es"));
    if (esVoice) utt.voice = esVoice;

    utt.onend = () => setPlaying(false);
    utt.onerror = () => setPlaying(false);
    uttRef.current = utt;
    synth.speak(utt);
    setPlaying(true);
  };

  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="red-border flex flex-col items-center gap-6 rounded-3xl p-8 text-center sm:flex-row sm:text-left"
        >
          <motion.div
            animate={
              playing
                ? { scale: [1, 1.15, 1], boxShadow: [
                    "0 0 0 0 rgba(199,56,56,0.5)",
                    "0 0 0 20px rgba(199,56,56,0)",
                    "0 0 0 0 rgba(199,56,56,0)",
                  ] }
                : {}
            }
            transition={{ duration: 1.2, repeat: playing ? Infinity : 0 }}
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--red-bright)] to-[var(--red-deep)]"
          >
            <Headphones className="h-7 w-7 text-[white]" />
          </motion.div>
          <div className="flex-1">
            <p className="font-serif text-xs tracking-[0.3em] text-[var(--red)] uppercase">
              Audio del menú
            </p>
            <h3 className="red-gradient mt-1 font-serif text-2xl font-bold sm:text-3xl">
              Escuchar recomendación
            </h3>
            <p className="mt-1 text-sm text-[var(--foreground)]/60">
              {supported
                ? "Deja que nuestro anfitrión te guíe por los platos estrella."
                : "Tu navegador no soporta audio. Usa Safari o Chrome."}
            </p>
          </div>
          <button
            onClick={toggle}
            disabled={!supported}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[white] to-[var(--red)] px-6 py-3 font-bold tracking-widest text-[var(--background)] uppercase shadow-lg shadow-[var(--red)]/30 transition-transform hover:scale-105 disabled:opacity-50"
          >
            {playing ? (
              <>
                <Pause className="h-4 w-4" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Escuchar
              </>
            )}
          </button>
        </motion.div>

        {playing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--red)]/70"
          >
            <Volume2 className="h-3 w-3" />
            <span className="tracking-widest uppercase">Reproduciendo...</span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
