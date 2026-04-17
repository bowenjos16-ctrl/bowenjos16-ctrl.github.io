"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Brain, Check, X, Trophy } from "lucide-react";
import { waGeneralLink } from "@/lib/config";

const QUESTIONS = [
  {
    q: "¿En qué año abrió Corte Piedra?",
    options: ["2023", "2024", "2025", "2022"],
    correct: 1,
  },
  {
    q: "¿Qué tipo de res usamos para nuestros cortes premium?",
    options: ["Angus", "Wagyu", "Brangus", "Hereford"],
    correct: 2,
  },
  {
    q: "¿Cuál es el precio del Tomahawk?",
    options: ["$18.00", "$20.00", "$14.00", "$16.00"],
    correct: 3,
  },
  {
    q: "¿Qué incluye el Carrusel de mariscos?",
    options: [
      "Solo ceviches",
      "Ceviche + arroz marinero + chicharrones + patacones",
      "Camarones al ajillo",
      "Sopa de mariscos",
    ],
    correct: 1,
  },
];

export default function Trivia() {
  const [step, setStep] = useState(-1); // -1 = intro, 0..N-1 = preguntas, N = resultado
  const [answers, setAnswers] = useState<number[]>([]);

  const start = () => {
    setStep(0);
    setAnswers([]);
  };

  const answer = (idx: number) => {
    const next = [...answers, idx];
    setAnswers(next);
    setStep(step + 1);
  };

  const correct = answers.filter((a, i) => a === QUESTIONS[i].correct).length;
  const total = QUESTIONS.length;
  const win = correct >= Math.ceil(total * 0.6);

  return (
    <div className="red-border relative overflow-hidden rounded-3xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Brain className="h-5 w-5 text-[var(--red-bright)]" />
        <span className="font-serif text-xs tracking-[0.3em] text-[var(--red)] uppercase">
          Trivia Corte Piedra
        </span>
      </div>

      <AnimatePresence mode="wait">
        {step === -1 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h3 className="red-gradient font-serif text-2xl font-black">
              ¿Conoces Corte Piedra?
            </h3>
            <p className="mt-2 text-sm text-[var(--foreground)]/60">
              4 preguntas. Acierta 3 o más y gana un cupón 10% OFF.
            </p>
            <button
              onClick={start}
              className="mt-6 w-full rounded-full bg-gradient-to-br from-[var(--red-bright)] to-[var(--red)] px-6 py-3 text-sm font-bold tracking-wider text-white uppercase shadow-lg transition-transform hover:scale-105"
            >
              Empezar trivia
            </button>
          </motion.div>
        )}

        {step >= 0 && step < QUESTIONS.length && (
          <motion.div
            key={`q${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-4 flex justify-between text-xs text-[var(--red)]/60">
              <span>
                Pregunta {step + 1}/{QUESTIONS.length}
              </span>
              <div className="flex gap-1">
                {QUESTIONS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 w-6 rounded-full ${
                      i <= step ? "bg-[var(--red)]" : "bg-[var(--red)]/20"
                    }`}
                  />
                ))}
              </div>
            </div>
            <h4 className="font-serif text-xl font-bold text-[var(--foreground)]">
              {QUESTIONS[step].q}
            </h4>
            <div className="mt-4 grid gap-2">
              {QUESTIONS[step].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => answer(i)}
                  className="rounded-xl border border-[var(--red)]/20 bg-[var(--charcoal)]/50 px-4 py-3 text-left text-[var(--foreground)]/80 transition-all hover:border-[var(--red)]/60 hover:bg-[var(--red)]/10 hover:text-[white]"
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === QUESTIONS.length && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                win
                  ? "bg-gradient-to-br from-[white] to-[var(--red)]"
                  : "bg-[var(--red)]"
              }`}
            >
              {win ? (
                <Trophy className="h-8 w-8 text-[var(--background)]" />
              ) : (
                <X className="h-8 w-8 text-white" />
              )}
            </motion.div>
            <h3 className="red-gradient font-serif text-2xl font-black">
              {correct}/{total} correctas
            </h3>
            {win ? (
              <>
                <p className="mt-2 text-sm text-[var(--foreground)]/70">
                  ¡Felicitaciones! Ganaste un cupón{" "}
                  <span className="text-[white]">TRIVIA10</span> por 10% OFF.
                </p>
                <a
                  href={waGeneralLink(
                    "Hola Corte Piedra 👋 Acerté la trivia. Tengo el cupón TRIVIA10 (10% OFF). Quiero pedir.",
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block rounded-full bg-[#25D366] px-6 py-2 text-xs font-bold tracking-widest text-white uppercase"
                >
                  Canjear en WhatsApp
                </a>
              </>
            ) : (
              <p className="mt-2 text-sm text-[var(--foreground)]/70">
                Sigue explorando el menú y vuelve a intentarlo.
              </p>
            )}
            <button
              onClick={() => setStep(-1)}
              className="mt-4 block w-full text-xs tracking-widest text-[white]/60 uppercase underline underline-offset-4"
            >
              Jugar otra vez
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
