"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Preloader from "./Preloader";

export default function PreloaderGate() {
  // Show=true por defecto → el preloader se renderiza en el primer frame,
  // evita el flash de la página principal antes de que hydrate React.
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Al cargar la página (incluyendo reload), limpiar hash → vuelve al hero
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      // Notificar a los listeners que el hash cambió
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
    // Scroll arriba
    window.scrollTo(0, 0);
  }, []);

  return (
    <AnimatePresence>
      {show && <Preloader onFinish={() => setShow(false)} />}
    </AnimatePresence>
  );
}
