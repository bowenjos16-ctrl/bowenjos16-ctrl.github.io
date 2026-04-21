"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Preloader from "./Preloader";

const KEY = "cp-preloader-seen";

export default function PreloaderGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(KEY);
    if (!seen) setShow(true);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <Preloader
          onFinish={() => {
            sessionStorage.setItem(KEY, "1");
            setShow(false);
          }}
        />
      )}
    </AnimatePresence>
  );
}
