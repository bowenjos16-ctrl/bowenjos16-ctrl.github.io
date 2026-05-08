"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Gift, X, Copy, Check } from "lucide-react";
import { useLoyalty } from "@/components/LoyaltyProvider";

const PRIZES = [
  { label: "5% OFF", short: "5% OFF", value: "CORTE5", color: "#c8202e", weight: 1 },
  { label: "Limonada de sandía personal", short: "Limonada", value: "LIMONADA", color: "#0a0a0a", weight: 1 },
  { label: "10% OFF", short: "10% OFF", value: "CORTE10", color: "#c8202e", weight: 1 },
  { label: "2x1 en Mojitos", short: "Mojitos 2x1", value: "MOJITO2X1", color: "#0a0a0a", weight: 3 },
  { label: "Cóctel de autor", short: "Cóctel", value: "COCTEL", color: "#c8202e", weight: 1 },
  { label: "Suerte para la próxima", short: "Suerte!", value: "NEXT_TIME", color: "#0a0a0a", weight: 3 },
  { label: "10% desc. en Ribeye", short: "Ribeye -10%", value: "RIBEYE10", color: "#c8202e", weight: 3 },
  { label: "Consumo valorado en $2.50", short: "$2.50", value: "VAL250", color: "#0a0a0a", weight: 1 },
];
const TOTAL_WEIGHT = PRIZES.reduce((s, p) => s + p.weight, 0);
const SEG = 360 / PRIZES.length;
const STORAGE_KEY_BASE = "corte-piedra-spin";
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias = 1 mes
// Clave de localStorage por usuario (cooldown propio por teléfono).
// Si no hay sesión, usa la global como fallback.
function storageKeyFor(telefono: string | null | undefined) {
  return telefono ? `${STORAGE_KEY_BASE}:${telefono}` : STORAGE_KEY_BASE;
}
// Sesión de auto-apertura al login: solo abrimos una vez por sesión de browser.
const AUTO_OPEN_FLAG = "corte-piedra-spin-autoopen";

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
  const { client, isLoggedIn } = useLoyalty();
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [won, setWon] = useState<(typeof PRIZES)[number] | null>(null);
  const [copied, setCopied] = useState(false);
  const [already, setAlready] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Carga el record de cooldown según el usuario (o el global si no hay sesión).
  // Se re-ejecuta al hacer login/logout para que cada usuario tenga su mes propio.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = storageKeyFor(client?.telefono);
    const saved = localStorage.getItem(key);

    // Reset del estado al cambiar de usuario.
    setWon(null);
    setAlready(false);
    setDaysLeft(0);
    setRotation(0);

    if (!saved) return;
    try {
      const data = JSON.parse(saved) as SpinRecord;
      // Compatibilidad: registros viejos sin timestamp se asumen vencidos.
      const ts = typeof data.timestamp === "number" ? data.timestamp : 0;
      const age = Date.now() - ts;
      if (age >= COOLDOWN_MS) {
        // Cooldown vencido: limpiar para permitir nueva tirada.
        localStorage.removeItem(key);
        return;
      }
      // Buscar el premio por value para mantener todas las propiedades vigentes.
      const current = PRIZES.find((p) => p.value === data.value);
      setWon(current ?? { label: data.label, short: data.short ?? data.label, value: data.value, color: data.color, weight: 1 });
      setAlready(true);
      setDaysLeft(Math.ceil((COOLDOWN_MS - age) / (24 * 60 * 60 * 1000)));
      // Restaurar la rotacion: SIEMPRE recalculamos desde el idx del premio
      // ganado para evitar el bug histórico donde se guardaban rotaciones con
      // turns fraccionarios que no coincidían con el segmento correcto.
      const idx = PRIZES.findIndex((p) => p.value === data.value);
      if (idx >= 0) setRotation(rotationForIndex(idx));
    } catch {}
  }, [client?.telefono]);

  // Auto-abrir la ruleta al hacer login si el usuario tiene giro disponible.
  // Solo una vez por sesión de browser para no ser molesto en cada navegación.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isLoggedIn || !client?.telefono) return;
    const flagKey = `${AUTO_OPEN_FLAG}:${client.telefono}`;
    if (sessionStorage.getItem(flagKey)) return;
    // Si NO ya tiró este mes, abrir invitando al giro.
    if (!already) {
      const t = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem(flagKey, "1");
      }, 800);
      return () => clearTimeout(t);
    }
  }, [isLoggedIn, client?.telefono, already]);

  const spin = () => {
    if (spinning || already) return;
    setSpinning(true);
    // Selección ponderada: premios con weight mayor caen con mayor probabilidad.
    let r = Math.random() * TOTAL_WEIGHT;
    let idx = 0;
    for (let i = 0; i < PRIZES.length; i++) {
      r -= PRIZES[i].weight;
      if (r <= 0) { idx = i; break; }
    }
    // IMPORTANTE: turns DEBE ser entero. Si fuera fraccionario el offset extra
    // (turns*360 mod 360 ≠ 0) desplaza el wheel y queda en el segmento equivocado.
    const turns = 6 + Math.floor(Math.random() * 3); // 6, 7 u 8 vueltas
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
      localStorage.setItem(storageKeyFor(client?.telefono), JSON.stringify(record));
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
                  : "Solo 1 giro gratis al mes por usuario"}
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
                          fontSize="7"
                          fontWeight="700"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${rot} ${tx} ${ty})`}
                          style={{ letterSpacing: "0.3px" }}
                        >
                          {p.short}
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
                    {won.value === "NEXT_TIME" ? "Casi" : "Ganaste"}
                  </p>
                  <p className="red-gradient font-serif text-2xl font-black">
                    {won.label}
                  </p>
                  {won.value !== "NEXT_TIME" && (
                    <>
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
                        Muestra este código al mesero al pagar
                      </p>
                    </>
                  )}
                  {won.value === "NEXT_TIME" && (
                    <p className="mt-3 text-[10px] tracking-wider text-white/60 uppercase">
                      Vuelve en 30 días para otra tirada
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
