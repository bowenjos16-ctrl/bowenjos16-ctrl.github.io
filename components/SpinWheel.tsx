"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Gift, X, Copy, Check, Lock } from "lucide-react";
import { useLoyalty } from "@/components/LoyaltyProvider";
import { apiGetSpinStatus, apiSpin } from "@/lib/loyalty";

// Solo se usa para renderizar la rueda. La selección del premio es autoritativa
// en backend (Apps Script): el endpoint devuelve el idx y aquí animamos.
const PRIZES = [
  { label: "5% OFF", short: "5% OFF", value: "CORTE5", color: "#c8202e" },
  { label: "Limonada de sandía personal", short: "Limonada", value: "LIMONADA", color: "#0a0a0a" },
  { label: "10% OFF", short: "10% OFF", value: "CORTE10", color: "#c8202e" },
  { label: "2x1 en Mojitos", short: "Mojitos 2x1", value: "MOJITO2X1", color: "#0a0a0a" },
  { label: "Cóctel de autor", short: "Cóctel", value: "COCTEL", color: "#c8202e" },
  { label: "Suerte para la próxima", short: "Suerte!", value: "NEXT_TIME", color: "#0a0a0a" },
  { label: "10% desc. en Ribeye", short: "Ribeye -10%", value: "RIBEYE10", color: "#c8202e" },
  { label: "Consumo valorado en $2.50", short: "$2.50", value: "VAL250", color: "#0a0a0a" },
];
const SEG = 360 / PRIZES.length;
const AUTO_OPEN_FLAG = "corte-piedra-spin-autoopen";

type WonState = (typeof PRIZES)[number] & { codigo: string };

// Rotación final que deja el segmento `idx` exactamente bajo el puntero (12 o'clock).
function rotationForIndex(idx: number) {
  return 360 - (idx * SEG + SEG / 2);
}

export default function SpinWheel() {
  const { client, isLoggedIn, openModal: openLoyaltyModal } = useLoyalty();
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [won, setWon] = useState<WonState | null>(null);
  const [copied, setCopied] = useState(false);
  const [already, setAlready] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [spinError, setSpinError] = useState<string | null>(null);
  const fetchedForRef = useRef<string | null>(null);

  // Reset al cambiar de usuario (logout o cambio de cuenta).
  useEffect(() => {
    setWon(null);
    setAlready(false);
    setDaysLeft(0);
    setRotation(0);
    setSpinError(null);
    fetchedForRef.current = null;
  }, [client?.telefono]);

  // Carga estado de la ruleta desde el backend cuando el usuario está logueado
  // y se abre el modal (lazy: solo cuando hace falta).
  const fetchStatus = useCallback(
    async (telefono: string) => {
      if (fetchedForRef.current === telefono) return;
      fetchedForRef.current = telefono;
      setLoadingStatus(true);
      try {
        const res = await apiGetSpinStatus(telefono);
        if (res.ok) {
          if (res.lastPrize && res.lastPrize.idx >= 0) {
            const idx = res.lastPrize.idx;
            const base = PRIZES[idx];
            if (base) {
              setWon({ ...base, codigo: res.lastPrize.codigo || "" });
              setRotation(rotationForIndex(idx));
            }
          }
          if (!res.available) {
            setAlready(true);
            setDaysLeft(res.daysLeft || 0);
          } else {
            setAlready(false);
            setDaysLeft(0);
          }
        }
      } catch (err) {
        console.warn("[spinwheel] status failed:", err);
      } finally {
        setLoadingStatus(false);
      }
    },
    [],
  );

  // Auto-abrir la ruleta al hacer login si tiene giro disponible. Solo 1 vez
  // por sesión de browser. Hace fetch del status para decidir.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isLoggedIn || !client?.telefono) return;
    const flagKey = `${AUTO_OPEN_FLAG}:${client.telefono}`;
    if (sessionStorage.getItem(flagKey)) return;
    sessionStorage.setItem(flagKey, "1");
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGetSpinStatus(client.telefono);
        if (cancelled) return;
        if (res.ok && res.available) {
          setTimeout(() => setOpen(true), 800);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, client?.telefono]);

  // Cargar status al abrir el modal (si es usuario logueado).
  useEffect(() => {
    if (!open) return;
    if (!isLoggedIn || !client?.telefono) return;
    fetchStatus(client.telefono);
  }, [open, isLoggedIn, client?.telefono, fetchStatus]);

  const spin = async () => {
    if (spinning || already) return;
    if (!isLoggedIn || !client?.telefono) return;
    setSpinError(null);
    setSpinning(true);
    try {
      const res = await apiSpin(client.telefono);
      if (!res.ok || !res.prize) {
        if (res.error === "cooldown" && res.daysLeft) {
          setAlready(true);
          setDaysLeft(res.daysLeft);
          // Hard-refresh status para mostrar el premio anterior si lo hay.
          fetchedForRef.current = null;
          fetchStatus(client.telefono);
        } else {
          setSpinError(res.error || "No se pudo girar");
        }
        setSpinning(false);
        return;
      }
      const prize = res.prize;
      const base = PRIZES[prize.idx];
      // Animar a ese idx con vueltas enteras para que el puntero quede exacto.
      const turns = 6 + Math.floor(Math.random() * 3); // 6, 7 u 8
      const stopAt = turns * 360 + rotationForIndex(prize.idx);
      setRotation(stopAt);
      setTimeout(() => {
        if (base) {
          setWon({ ...base, codigo: prize.codigo || "" });
        }
        setSpinning(false);
        setAlready(true);
        setDaysLeft(30);
      }, 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error de red";
      setSpinError(msg);
      setSpinning(false);
    }
  };

  const copy = async () => {
    if (!won || !won.codigo) return;
    await navigator.clipboard.writeText(won.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoginClick = () => {
    setOpen(false);
    openLoyaltyModal();
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

              {/* Botón girar / login según estado */}
              {!already && !isLoggedIn && (
                <div className="mt-2 flex flex-col items-center gap-3">
                  <button
                    disabled
                    className="flex items-center gap-2 rounded-full bg-[var(--charcoal)] px-10 py-3 font-serif text-sm font-bold tracking-widest text-white/40 uppercase"
                  >
                    <Lock className="h-4 w-4" />
                    Girar
                  </button>
                  <button
                    onClick={handleLoginClick}
                    className="text-xs tracking-widest text-[var(--red)] uppercase underline-offset-4 hover:underline"
                  >
                    Inicia sesión para girar
                  </button>
                </div>
              )}

              {!already && isLoggedIn && (
                <button
                  onClick={spin}
                  disabled={spinning || loadingStatus}
                  className="mt-2 rounded-full bg-gradient-to-br from-[white] to-[var(--red)] px-10 py-3 font-serif text-sm font-bold tracking-widest text-[var(--background)] uppercase shadow-lg shadow-[var(--red)]/30 transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {spinning ? "Girando..." : loadingStatus ? "Cargando..." : "Girar"}
                </button>
              )}

              {spinError && (
                <p className="mt-3 text-xs text-[var(--red)]">{spinError}</p>
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
                  {won.value !== "NEXT_TIME" && won.codigo && (
                    <>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <code className="rounded-md bg-[var(--charcoal)] px-3 py-1.5 font-mono text-sm text-[white]">
                          {won.codigo}
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
