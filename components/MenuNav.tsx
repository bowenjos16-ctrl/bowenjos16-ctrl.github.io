"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { menu } from "@/lib/menu-data";

export default function MenuNav() {
  const [active, setActive] = useState<string>(menu[0].id);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);

      let current = menu[0].id;
      for (const cat of menu) {
        const el = document.getElementById(cat.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight / 2) current = cat.id;
        }
      }
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="fixed top-4 left-1/2 z-50 hidden -translate-x-1/2 md:block"
        >
          <div className="red-border flex items-center gap-1 rounded-full px-2 py-2 backdrop-blur-lg">
            {menu.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className={`relative rounded-full px-4 py-2 text-xs font-medium tracking-wide uppercase transition-colors ${
                  active === cat.id
                    ? "text-[var(--background)]"
                    : "text-[var(--foreground)]/60 hover:text-[white]"
                }`}
              >
                {active === cat.id && (
                  <motion.span
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-[white] to-[var(--red)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.title}</span>
              </a>
            ))}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
