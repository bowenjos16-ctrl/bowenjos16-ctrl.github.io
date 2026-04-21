"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useTheme } from "./ThemeProvider";

type Phase = "welcome" | "bienvenidos" | "logo" | "done";

const PHASE_DURATION = {
  welcome: 1100,
  bienvenidos: 1100,
  logo: 1300,
};

export default function Preloader({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<Phase>("welcome");
  const { menuKind } = useTheme();

  useEffect(() => {
    // Bloquear scroll durante el preloader
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => setPhase("bienvenidos"), PHASE_DURATION.welcome),
    );
    timers.push(
      window.setTimeout(
        () => setPhase("logo"),
        PHASE_DURATION.welcome + PHASE_DURATION.bienvenidos,
      ),
    );
    timers.push(
      window.setTimeout(
        () => setPhase("done"),
        PHASE_DURATION.welcome +
          PHASE_DURATION.bienvenidos +
          PHASE_DURATION.logo,
      ),
    );
    timers.push(
      window.setTimeout(
        () => onFinish(),
        PHASE_DURATION.welcome +
          PHASE_DURATION.bienvenidos +
          PHASE_DURATION.logo +
          600,
      ),
    );

    return () => {
      document.documentElement.style.overflow = prev;
      timers.forEach((t) => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "done" ? 0 : 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Fondo radial con color del tema */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--red-rgb),0.22),transparent_60%)]" />

      {/* Partículas mínimas */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.span
            key={i}
            initial={{
              opacity: 0,
              x: Math.random() * 100 - 50 + "vw",
              y: "100vh",
            }}
            animate={{
              opacity: [0, 0.6, 0],
              y: "-10vh",
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              delay: Math.random() * 3,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute h-1 w-1 rounded-full bg-[var(--red-bright)]"
            style={{ left: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {phase === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(12px)" }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-10 text-center"
          >
            <p className="mb-3 font-serif text-xs tracking-[0.6em] text-[var(--red)] uppercase sm:text-sm">
              · EN ·
            </p>
            <h1 className="font-serif text-6xl font-black tracking-tight text-white sm:text-8xl">
              Welcome
            </h1>
          </motion.div>
        )}

        {phase === "bienvenidos" && (
          <motion.div
            key="bienvenidos"
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(12px)" }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-10 text-center"
          >
            <p className="mb-3 font-serif text-xs tracking-[0.6em] text-[var(--red)] uppercase sm:text-sm">
              · ES ·
            </p>
            <h1 className="red-gradient font-serif text-6xl font-black tracking-tight sm:text-8xl">
              Bienvenidos
            </h1>
          </motion.div>
        )}

        {(phase === "logo" || phase === "done") && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.6, filter: "blur(18px)" }}
            animate={{
              opacity: phase === "done" ? 0 : 1,
              scale: 1,
              filter: "blur(0px)",
            }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-10 flex flex-col items-center drop-shadow-[0_0_40px_rgba(var(--red-rgb),0.45)]"
          >
            <div className="flame-flicker">
              <Logo
                variant={menuKind === "tradicional" ? "stacked-green" : "stacked"}
                width={380}
                priority
                className="h-auto w-[min(72vw,320px)] sm:w-[min(60vw,380px)]"
              />
            </div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-6 font-serif text-sm tracking-[0.35em] text-[var(--red)]/90 italic uppercase sm:text-base"
            >
              Experiencia Gourmet
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Línea progresiva inferior */}
      <div className="absolute bottom-12 left-1/2 h-px w-40 -translate-x-1/2 overflow-hidden bg-white/10">
        <motion.div
          className="h-full bg-[var(--red)]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration:
              (PHASE_DURATION.welcome +
                PHASE_DURATION.bienvenidos +
                PHASE_DURATION.logo) /
              1000,
            ease: "linear",
          }}
        />
      </div>
    </motion.div>
  );
}
