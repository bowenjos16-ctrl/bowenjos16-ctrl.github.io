"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Martini, X } from "lucide-react";
import { CONFIG } from "@/lib/config";

export default function HappyHourBadge() {
  const [active, setActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = () => {
      const h = new Date().getHours();
      setActive(
        h >= CONFIG.happyHour.startHour && h < CONFIG.happyHour.endHour,
      );
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);

  const show = active && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed right-4 bottom-24 z-40 max-w-xs sm:right-6"
        >
          <div className="red-border relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--red)]/80 to-[var(--charcoal)]/90 p-4 shadow-2xl backdrop-blur">
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-2 right-2 text-white/50 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start gap-3 pr-5">
              <motion.div
                animate={{ rotate: [0, -15, 15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--red)]/20"
              >
                <Martini className="h-5 w-5 text-[white]" />
              </motion.div>
              <div>
                <span className="inline-block rounded-full bg-[var(--ember)] px-2 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
                  En vivo
                </span>
                <h4 className="mt-1 font-serif text-sm font-bold text-[white]">
                  Happy Hour activa
                </h4>
                <p className="mt-0.5 text-xs text-white/70">
                  {CONFIG.happyHour.discount} · hasta las{" "}
                  {CONFIG.happyHour.endHour}:00
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
