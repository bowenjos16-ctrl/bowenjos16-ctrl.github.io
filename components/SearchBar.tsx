"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { menu } from "@/lib/menu-data";
import { waLink } from "@/lib/config";

type Hit = {
  name: string;
  price?: string;
  categoryId: string;
  categoryTitle: string;
  sectionTitle: string;
  description?: string;
};

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    const out: Hit[] = [];
    for (const cat of menu) {
      for (const sec of cat.sections) {
        for (const it of sec.items) {
          if (
            it.name.toLowerCase().includes(needle) ||
            it.description?.toLowerCase().includes(needle)
          ) {
            out.push({
              name: it.name,
              price: it.price,
              description: it.description,
              categoryId: cat.id,
              categoryTitle: cat.title,
              sectionTitle: sec.title,
            });
          }
        }
      }
    }
    return out.slice(0, 12);
  }, [q]);

  const go = (hit: Hit) => {
    setOpen(false);
    setQ("");
    const el = document.getElementById(hit.categoryId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--red)]/30 bg-[var(--charcoal)]/80 text-[white] backdrop-blur transition-all hover:bg-[var(--red)]/20 md:top-5 md:right-6"
        aria-label="Buscar"
      >
        <Search className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[95] flex items-start justify-center bg-black/70 p-4 pt-24 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.96, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: -10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--red)]/30 bg-[var(--background)]/95 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 border-b border-[var(--red)]/20 px-5 py-4">
                <Search className="h-5 w-5 text-[var(--red)]" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar platos, bebidas, cócteles..."
                  className="flex-1 bg-transparent text-lg text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 focus:outline-none"
                />
                <button
                  onClick={() => setOpen(false)}
                  className="text-[var(--foreground)]/50 hover:text-[white]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {q.trim() && results.length === 0 && (
                  <p className="p-6 text-center text-sm text-[var(--foreground)]/50">
                    Nada encontrado para &ldquo;{q}&rdquo;
                  </p>
                )}
                {!q.trim() && (
                  <div className="p-4">
                    <p className="mb-2 text-xs tracking-widest text-[var(--red)]/60 uppercase">
                      Populares
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Tomahawk",
                        "Hamburguesa",
                        "Ceviche",
                        "Mojito",
                        "Picadita",
                        "Vino",
                      ].map((t) => (
                        <button
                          key={t}
                          onClick={() => setQ(t)}
                          className="rounded-full border border-[var(--red)]/30 bg-[var(--red)]/5 px-3 py-1 text-xs text-[var(--foreground)]/70 hover:bg-[var(--red)]/15"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {results.map((h) => (
                  <button
                    key={`${h.categoryId}-${h.name}`}
                    onClick={() => go(h)}
                    className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-[var(--red)]/10"
                  >
                    <div className="flex-1">
                      <p className="font-serif text-base text-[var(--foreground)] group-hover:text-[white]">
                        {h.name}
                      </p>
                      <p className="mt-0.5 text-[11px] tracking-widest text-[var(--red)]/60 uppercase">
                        {h.categoryTitle} · {h.sectionTitle}
                      </p>
                    </div>
                    {h.price && (
                      <span className="price-tag text-lg">${h.price}</span>
                    )}
                    <a
                      href={waLink(h.name, h.price)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Pedir por WhatsApp"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </button>
                ))}
              </div>
              <div className="border-t border-[var(--red)]/10 px-4 py-2 text-[10px] tracking-widest text-[var(--foreground)]/40 uppercase">
                <kbd className="rounded bg-[var(--red)]/10 px-1.5 py-0.5">
                  Esc
                </kbd>{" "}
                cerrar ·{" "}
                <kbd className="rounded bg-[var(--red)]/10 px-1.5 py-0.5">
                  ⌘K
                </kbd>{" "}
                abrir
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
