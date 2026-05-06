"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Gift, X, Copy, Check } from "lucide-react";

const PRIZES = [
  { label: "5% OFF", value: "CORTE5", color: "#c8202e" },
  { label: "Bebida gratis", value: "DRINK_FREE", color: "#0a0a0a" },
  { label: "10% OFF", value: "CORTE10", color: "#c8202e" },
  { label: "Postre x $1", value: "DESSERT1", color: "#0a0a0a" },
  { label: "15% OFF", value: "CORTE15", color: "#c8202e" },
  { label: "2x1 mojitos", value: "MOJITO2X1", color: "#0a0a0a" },
  { label: "Entrada gratis", value: "ENTRADA0", color: "#c8202e" },
  { label: "20% OFF", value: "CORTE20", color: "#0a0a0a" },
];
const SEG = 360 / PRIZES.length;
const STORAGE_KEY = "corte-piedra-spin";
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

type SpinRecord = (typeof PRIZES)[number] & {
  timestamp?: number;
  rotation?: number;
};

// Rotacion final que deja el segmento `idx` exactamente bajo el puntero (12 o'clock).
// Se usa como fallback si el record guardado no tiene rotation.
function rotationForIndex(idx: number) {
  return 360 - (idx * SEG + SEG / 2);
}

export default function SpinWheel() {
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [won, setWon] = useState<(typeof PRIZES)[number] | null>(null);
  const [copied, setCopied] = useState(false);
  const [already, setAlready] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null;
    if (!saved) return;
    try {
      const data = JSON.parse(saved) as SpinRecord;
      // Compatibilidad: registros viejos sin timestamp se asumen vencidos.
      const ts = typeof data.timestamp === "number" ? data.timestamp : 0;
      const age = Date.now() - ts;
      if (age >= COOLDOWN_MS) {
        // Cooldown vencido: limpiar para permitir nueva tirada.
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      setWon({ label: data.label, value: data.value, color: data.color });
      setAlready(true);
      setDaysLeft(Math.ceil((COOLDOWN_MS - age) / (24 * 60 * 60 * 1000)));
      // Restaurar la rotacion para que el puntero coincida con el premio guardado.
      // Si no hay rotacion guardada (records viejos), la calculamos a partir
      // del indice del premio en PRIZES.
      if (typeof data.rotation === "number") {
        setRotation(data.rotation);
      } else {
        const idx = PRIZES.findIndex((p) => p.value === data.value);
        if (idx >= 0) setRotation(rotationForIndex(idx));
      }
    } catch {}
  }, []);

  const spin = () => {
    if (spinning || already) return;
    setSpinning(true);
    const idx = Math.floor(Math.random() * PRIZES.length);
    const turns = 6 + Math.random() * 2;
    const stopAt = turns * 360 + (360 - (idx * SEG + SEG / 2));
    setRotation(stopAt);
    setTimeout(() => {
      const prize = PRIZES[idx];
      setWon(prize);
      setSpinning(false);
      const record: SpinRecord = {
        ...prize,
        timestamp: Date.now(),
        rotation: stopAt,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      setAlready(true);
      setDaysLeft(30);
    }, 5000);
  };

  const copy = async () => {
    if (!won) return;
    await navigator.clipboard.writeText(won.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: "spring" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[white] to-[var(--red)] shadow-lg shadow-[var(--red)]/30 sm:right-6 sm:bottom-6"
        aria-label="Girar ruleta de descuentos"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          <Gift className="h-6 w-6 text-[var(--background)]" />
        </motion.div>
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ember)] text-[10px] font-bold text-white">
          1
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-lg"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="red-border relative w-full max-w-md rounded-3xl bg-[var(--background)]/95 p-6 text-center sm:p-8"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-[var(--foreground)]/50 hover:text-[white]"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-2 flex items-center justify-center gap-2 text-[var(--red)]">
                <Sparkles className="h-4 w-4" />
                <span className="font-serif text-xs tracking-[0.3em] uppercase">
                  Ruleta de la casa
                </span>
                <Sparkles className="h-4 w-4" />
              </div>

              <h3 className="red-gradient font-serif text-3xl font-black">
                {already ? "Tu premio" : "Gira y gana"}
              </h3>
              <p className="mt-1 text-sm text-[var(--foreground)]/60">
                {already
                  ? `Usa tu cupón al pagar · Próximo giro en ${daysLeft} día${daysLeft === 1 ? "" : "s"}`
                  : "Una tirada gratis cada 30 días"}
              </p>

              {/* Wheel */}
              <div className="relative mx-auto my-8 h-72 w-72">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-1">
                  <div className="h-0 w-0 border-x-[10px] border-t-[20px] border-x-transparent border-t-[white] drop-shadow-lg" />
                </div>
                <motion.svg
                  viewBox="0 0 200 200"
                  className="h-full w-full drop-shadow-[0_0_20px_rgba(200,32,46,0.3)]"
                  animate={{ rotate: rotation }}
                  transition={{ duration: 5, ease: [0.23, 1, 0.32, 1] }}
                >
                  {PRIZES.map((p, i) => {
                    const a0 = (i * SEG - 90) * (Math.PI / 180);
                    const a1 = ((i + 1) * SEG - 90) * (Math.PI / 180);
                    const x0 = 100 + 100 * Math.cos(a0);
                    const y0 = 100 + 100 * Math.sin(a0);
                    const x1 = 100 + 100 * Math.cos(a1);
                    const y1 = 100 + 100 * Math.sin(a1);
                    const mid = (i * SEG + SEG / 2 - 90) * (Math.PI / 180);
                    const tx = 100 + 60 * Math.cos(mid);
                    const ty = 100 + 60 * Math.sin(mid);
                    const rot = i * SEG + SEG / 2;
                    return (
                      <g key={p.value}>
                        <path
                          d={`M100 100 L${x0} ${y0} A100 100 0 0 1 ${x1} ${y1} Z`}
                          fill={p.color}
                          stroke="#0a0604"
                          strokeWidth="1"
                        />
                        <text
                          x={tx}
                          y={ty}
                          fill="#f5ead3"
                          fontSize="8"
                          fontWeight="700"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${rot} ${tx} ${ty})`}
                          style={{ letterSpacing: "0.5px" }}
                        >
                          {p.label}
                        </text>
                      </g>
                    );
                  })}
                  <circle
                    cx="100"
                    cy="100"
                    r="12"
                    fill="#c8202e"
                    stroke="#0a0604"
                    strokeWidth="2"
                  />
                </motion.svg>
              </div>

              {!already && (
                <button
                  onClick={spin}
                  disabled={spinning}
                  className="mt-2 rounded-full bg-gradient-to-br from-[white] to-[var(--red)] px-10 py-3 font-serif text-sm font-bold tracking-widest text-[var(--background)] uppercase shadow-lg shadow-[var(--red)]/30 transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {spinning ? "Girando..." : "Girar"}
                </button>
              )}

              {won && !spinning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 rounded-2xl border border-[var(--red)]/40 bg-[var(--red)]/5 p-4"
                >
                  <p className="text-xs tracking-widest text-[var(--red)] uppercase">
                    Ganaste
                  </p>
                  <p className="red-gradient font-serif text-2xl font-black">
                    {won.label}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <code className="rounded-md bg-[var(--charcoal)] px-3 py-1.5 font-mono text-sm text-[white]">
                      {won.value}
                    </code>
                    <button
                      onClick={copy}
                      className="text-[white] hover:text-white"
                      aria-label="Copiar código"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-3 text-[10px] tracking-wider text-white/60 uppercase">
                    Muestra este c\u00f3digo al mesero al pagar
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
