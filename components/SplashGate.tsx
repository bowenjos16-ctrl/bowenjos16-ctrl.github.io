"use client";

import { useEffect, useState } from "react";
import Splash from "./Splash";

const KEY = "cp-splash-seen";

export default function SplashGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(KEY);
    if (!seen) setShow(true);
  }, []);

  if (!show) return null;
  return (
    <Splash
      onClose={() => {
        sessionStorage.setItem(KEY, "1");
        setShow(false);
      }}
    />
  );
}
