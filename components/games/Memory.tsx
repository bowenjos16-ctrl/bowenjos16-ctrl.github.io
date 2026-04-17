"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Brain, Trophy, RotateCcw } from "lucide-react";
import { waGeneralLink } from "@/lib/config";

const DISHES = [
  { id: "tomahawk", emoji: "🥩", label: "Tomahawk" },
  { id: "ceviche", emoji: "🦐", label: "Ceviche" },
  { id: "pizza", emoji: "🍕", label: "Pizza" },
  { id: "burger", emoji: "🍔", label: "Burger" },
  { id: "wine", emoji: "🍷", label: "Vino" },
  { id: "mojito", emoji: "🍹", label: "Mojito" },
];

type Card = {
  id: string;
  emoji: string;
  label: string;
  uid: number;
  matched: boolean;
};

function shuffle(arr: Card[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Memory() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const reset = () => {
    const deck = [...DISHES, ...DISHES].map((d, i) => ({
      ...d,
      uid: i,
      matched: false,
    }));
    setCards(shuffle(deck));
    setFlipped([]);
    setMoves(0);
    setWon(false);
  };

  useEffect(() => {
    reset();
  }, []);

  useEffect(() => {
    if (flipped.length === 2) {
      const [a, b] = flipped;
      const t = setTimeout(() => {
        if (cards[a].id === cards[b].id) {
          setCards((cs) =>
            cs.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)),
          );
        }
        setFlipped([]);
        setMoves((m) => m + 1);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [flipped, cards]);

  useEffect(() => {
    if (cards.length && cards.every((c) => c.matched)) {
      setTimeout(() => setWon(true), 500);
    }
  }, [cards]);

  const flip = (i: number) => {
    if (flipped.length >= 2 || flipped.includes(i) || cards[i].matched) return;
    setFlipped([...flipped, i]);
  };

  return (
    <div className="red-border relative overflow-hidden rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[var(--red)]" />
          <span className="font-serif text-xs tracking-[0.3em] text-[var(--red)] uppercase">
            Memorama de platos
          </span>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1 text-xs text-[var(--red)]/60 hover:text-[white]"
          aria-label="Reiniciar"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {won ? (
          <motion.div
            key="won"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring" }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[white] to-[var(--red)]"
            >
              <Trophy className="h-8 w-8 text-[var(--background)]" />
            </motion.div>
            <h3 className="red-gradient font-serif text-2xl font-black">
              ¡Ganaste!
            </h3>
            <p className="mt-2 text-sm text-[var(--foreground)]/70">
              Completado en {moves} movimientos. Cupón{" "}
              <span className="text-[white]">MEMO5</span> — 5% OFF.
            </p>
            <a
              href={waGeneralLink(
                `Hola Corte Piedra 👋 Completé el memorama en ${moves} movs. Tengo el cupón MEMO5.`,
              )}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block rounded-full bg-[#25D366] px-6 py-2 text-xs font-bold tracking-widest text-white uppercase"
            >
              Canjear
            </a>
          </motion.div>
        ) : (
          <motion.div
            key="board"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="mb-3 text-xs text-[var(--red)]/60">
              Movimientos: {moves}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {cards.map((c, i) => {
                const shown = flipped.includes(i) || c.matched;
                return (
                  <button
                    key={c.uid}
                    onClick={() => flip(i)}
                    className="relative aspect-square [perspective:1000px]"
                    aria-label={shown ? c.label : "Carta oculta"}
                  >
                    <motion.div
                      animate={{ rotateY: shown ? 180 : 0 }}
                      transition={{ duration: 0.4 }}
                      className="relative h-full w-full [transform-style:preserve-3d]"
                    >
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-br from-[var(--red)] to-[var(--red-deep)] [backface-visibility:hidden]">
                        <span className="font-serif text-xl text-white">?</span>
                      </div>
                      <div
                        className={`absolute inset-0 flex items-center justify-center rounded-lg text-3xl [transform:rotateY(180deg)] [backface-visibility:hidden] ${
                          c.matched
                            ? "bg-[var(--red)]/20 ring-1 ring-[var(--red)]"
                            : "bg-[var(--charcoal)]"
                        }`}
                      >
                        {c.emoji}
                      </div>
                    </motion.div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
