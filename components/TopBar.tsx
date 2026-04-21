"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Logo from "./Logo";

export default function TopBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="fixed top-4 left-1/2 z-40 -translate-x-1/2"
        >
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              // Limpiar hash para mostrar hero de nuevo + dispatch event
              if (window.location.hash) {
                history.pushState(null, "", window.location.pathname);
                window.dispatchEvent(new HashChangeEvent("hashchange"));
              }
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-3 rounded-full border border-[var(--red)]/30 bg-[var(--background)]/80 px-5 py-2 shadow-lg shadow-black/40 backdrop-blur-lg transition-all hover:border-[var(--red)]/60"
            aria-label="Inicio · Corte Piedra"
          >
            <Logo variant="white" width={120} className="h-6 w-auto" />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
