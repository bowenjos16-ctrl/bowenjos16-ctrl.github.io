"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Gamepad2, Brain, Gift, Dices, Lock, Clock } from "lucide-react";
import Trivia from "./games/Trivia";
import Memory from "./games/Memory";
import Scratch from "./games/Scratch";
import { useLoyalty } from "./LoyaltyProvider";
import {
  getLock,
  setLock,
  hoursUntilUnlock,
  formatCountdown,
} from "@/lib/game-lock";
import { CONFIG } from "@/lib/config";

type GameId = "trivia" | "memoria" | "rasca";

const GAMES = [
  {
    id: "trivia" as GameId,
    label: "Trivia",
    tagline: "¿Qué tan bien conoces Corte Piedra?",
    description:
      "4 preguntas rápidas sobre nuestros platos. Acierta 3 o más y gánate un 10% OFF en tu próxima visita.",
    Icon: Brain,
    prize: "10% OFF",
    component: Trivia,
  },
  {
    id: "memoria" as GameId,
    label: "Memorama",
    tagline: "Encuentra las parejas de platos",
    description:
      "12 cartas con nuestros platos más queridos. Completa las parejas y gana un 5% OFF.",
    Icon: Dices,
    prize: "5% OFF",
    component: Memory,
  },
  {
    id: "rasca" as GameId,
    label: "Rasca y gana",
    tagline: "Raspa la tarjeta para revelar tu premio",
    description:
      "Premios al azar — bebidas gratis, postre por $1, descuentos hasta 20%.",
    Icon: Gift,
    prize: "Hasta 20%",
    component: Scratch,
  },
];

export default function GameZone() {
  const { client } = useLoyalty();
  const [active, setActive] = useState<GameId>("trivia");
  const [lockedGame, setLockedGame] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  const refreshLock = useCallback(() => {
    if (!client) return;
    const lock = getLock(client.telefono);
    if (lock) {
      setLockedGame(lock.gameId);
      setCountdown(hoursUntilUnlock(client.telefono));
      setActive(lock.gameId as GameId); // mostrar el que ya jugó
    } else {
      setLockedGame(null);
      setCountdown(0);
    }
  }, [client]);

  useEffect(() => {
    refreshLock();
    const id = setInterval(refreshLock, 60_000); // actualizar cada minuto
    return () => clearInterval(id);
  }, [refreshLock]);

  // Al jugar: registra lock
  const handlePlayed = useCallback(() => {
    if (!client) return;
    setLock(client.telefono, active);
    refreshLock();
  }, [client, active, refreshLock]);

  const activeGame = GAMES.find((g) => g.id === active)!;
  const ActiveComponent = activeGame.component;
  const isLocked = !!lockedGame;

  return (
    <section id="juegos" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header */}
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
            1 juego por visita · Premio real
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="red-gradient mt-3 font-serif text-4xl font-black sm:text-5xl"
          >
            Zona de diversión
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-sm text-white/65 sm:text-base"
          >
            Elige <strong>un solo</strong> juego. Puedes jugar otro en{" "}
            <strong>{CONFIG.gameCooldownHours} horas</strong>.
          </motion.p>
        </div>

        {/* Aviso de cooldown activo */}
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-6 flex max-w-md items-center gap-3 rounded-2xl border border-[var(--red)]/30 bg-[var(--red)]/10 p-4"
          >
            <Clock className="h-5 w-5 flex-shrink-0 text-[var(--red-bright)]" />
            <div>
              <p className="text-xs font-bold tracking-wider text-white uppercase">
                Próximo juego disponible en {formatCountdown(countdown)}
              </p>
              <p className="mt-0.5 text-[10px] text-white/60">
                Vuelve a visitarnos para jugar otro.
              </p>
            </div>
          </motion.div>
        )}

        {/* Sub-tabs */}
        <div className="mx-auto mb-8 flex max-w-xl gap-1 rounded-full border border-white/10 bg-white/[0.02] p-1 backdrop-blur">
          {GAMES.map((g) => {
            const isActive = active === g.id;
            const isThisLocked = isLocked && lockedGame !== g.id;
            return (
              <button
                key={g.id}
                onClick={() => !isThisLocked && setActive(g.id)}
                disabled={isThisLocked}
                className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-[11px] font-bold tracking-wide uppercase transition-colors sm:text-xs ${
                  isActive
                    ? "text-black"
                    : isThisLocked
                      ? "cursor-not-allowed text-white/25"
                      : "text-white/65 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="game-tab-bg"
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--ember)] to-[var(--red-bright)]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {isThisLocked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <g.Icon className="h-3.5 w-3.5" />
                  )}
                  <span>{g.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Header del juego activo */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGame.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-6 text-center"
          >
            <p className="font-serif text-xs tracking-widest text-[var(--red)]/80 uppercase">
              {activeGame.label} · Premio {activeGame.prize}
            </p>
            <h3 className="mt-1 font-serif text-xl font-bold text-white sm:text-2xl">
              {activeGame.tagline}
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">
              {activeGame.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Juego activo */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`game-${activeGame.id}-${isLocked ? "locked" : "play"}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto max-w-lg"
          >
            <ActiveComponent onPlayed={handlePlayed} locked={isLocked} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
