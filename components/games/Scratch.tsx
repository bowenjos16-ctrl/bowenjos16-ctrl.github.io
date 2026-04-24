"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Gift } from "lucide-react";

const PRIZES = [
  { label: "Bebida gratis", code: "DRINK", weight: 2 },
  { label: "10% OFF", code: "SCRATCH10", weight: 5 },
  { label: "Postre sorpresa", code: "SWEET", weight: 3 },
  { label: "20% OFF", code: "SCRATCH20", weight: 1 },
];

function pickPrize() {
  const total = PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of PRIZES) {
    if (r < p.weight) return p;
    r -= p.weight;
  }
  return PRIZES[0];
}

type GameProps = { onPlayed?: () => void; locked?: boolean };

export default function Scratch({ onPlayed, locked }: GameProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [prize] = useState(pickPrize);
  const [revealed, setRevealed] = useState(false);
  const [percent, setPercent] = useState(0);
  const scratching = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;

    // Overlay "rasca aquí"
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#3a0808");
    grad.addColorStop(0.5, "#c8202e");
    grad.addColorStop(1, "#3a0808");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ RASCA AQUÍ ✨", w / 2, h / 2);

    ctx.globalCompositeOperation = "destination-out";
  }, []);

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (revealed || locked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const point =
      "touches" in e
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY };
    const x = ((point.x - rect.left) / rect.width) * canvas.width;
    const y = ((point.y - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0;
    for (let i = 3; i < data.length; i += 40) {
      if (data[i] === 0) cleared++;
    }
    const p = (cleared / (data.length / 40)) * 100;
    setPercent(p);
    if (p > 45 && !revealed) {
      setRevealed(true);
      if (onPlayed) onPlayed();
    }
  };

  return (
    <div className="red-border relative overflow-hidden rounded-3xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Gift className="h-5 w-5 text-[var(--ember)]" />
        <span className="font-serif text-xs tracking-[0.3em] text-[var(--red)] uppercase">
          Rasca y gana
        </span>
      </div>

      <div className="relative mx-auto aspect-[16/10] max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-[white] to-[var(--red)]">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <Sparkles className="mb-2 h-8 w-8 text-[var(--background)]" />
          <p className="font-serif text-xs tracking-widest text-[var(--background)] uppercase">
            Ganaste
          </p>
          <p className="font-serif text-3xl font-black text-[var(--red-deep)]">
            {prize.label}
          </p>
          <code className="mt-2 rounded-md bg-[var(--background)] px-2 py-0.5 font-mono text-xs text-[white]">
            {prize.code}
          </code>
        </div>
        <canvas
          ref={canvasRef}
          width={400}
          height={250}
          className={`absolute inset-0 h-full w-full cursor-grab touch-none select-none ${
            revealed ? "pointer-events-none" : ""
          }`}
          onMouseDown={() => (scratching.current = true)}
          onMouseUp={() => (scratching.current = false)}
          onMouseLeave={() => (scratching.current = false)}
          onMouseMove={(e) => scratching.current && scratch(e)}
          onTouchStart={() => (scratching.current = true)}
          onTouchEnd={() => (scratching.current = false)}
          onTouchMove={(e) => scratching.current && scratch(e)}
        />
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center text-[11px] tracking-wider text-white/60 uppercase"
          >
            Muestra este c\u00f3digo al mesero al pagar
          </motion.p>
        )}
      </AnimatePresence>

      {!revealed && (
        <p className="mt-3 text-center text-xs text-[var(--red)]/60">
          Rascado: {Math.round(percent)}%
        </p>
      )}
    </div>
  );
}
