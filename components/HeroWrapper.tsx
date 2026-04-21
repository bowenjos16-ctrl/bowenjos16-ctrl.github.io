"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Oculta al Hero + AboutStrip cuando hay un tab activo via hash.
 * Así el usuario no ve la portada de fondo cuando está navegando una sección.
 */
export default function HeroWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const check = () => {
      const hash = window.location.hash.slice(1);
      setHidden(!!hash);
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);

  return (
    <AnimatePresence initial={false}>
      {!hidden && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          style={{ overflow: "hidden" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
