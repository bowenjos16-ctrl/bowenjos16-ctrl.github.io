"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  UtensilsCrossed,
  CalendarDays,
  ChefHat,
  ImageIcon,
  Gamepad2,
  Star,
  Headphones,
  type LucideIcon,
} from "lucide-react";

import MenuCategory from "@/components/MenuCategory";
import ChefPick from "@/components/ChefPick";
import Gallery from "@/components/Gallery";
import AudioRecommendation from "@/components/AudioRecommendation";
import LiveEvents from "@/components/LiveEvents";
import RatingSystem from "@/components/RatingSystem";
import GameZone from "@/components/GameZone";
import SocialIncentive from "@/components/SocialIncentive";
import PromoBanner from "@/components/PromoBanner";
import { menu } from "@/lib/menu-data";

type Tab = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
};

const TABS: Tab[] = [
  { id: "menu", label: "Menú", icon: UtensilsCrossed, color: "#c8202e" },
  { id: "eventos", label: "Eventos", icon: CalendarDays, color: "#c73838" },
  { id: "chef", label: "Chef", icon: ChefHat, color: "#c8202e" },
  { id: "audio", label: "Audio", icon: Headphones, color: "#ffffff" },
  { id: "galeria", label: "Galería", icon: ImageIcon, color: "#c8202e" },
  { id: "juegos", label: "Juegos", icon: Gamepad2, color: "#ff5a2e" },
  { id: "opina", label: "Opina", icon: Star, color: "#ffffff" },
];

export default function SectionTabs() {
  const [active, setActive] = useState("menu");
  const [menuSub, setMenuSub] = useState(menu[0].id);

  // Read hash on mount + listen for changes
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      if (TABS.some((t) => t.id === hash)) {
        setActive(hash);
        return;
      }
      if (menu.some((c) => c.id === hash)) {
        setActive("menu");
        setMenuSub(hash);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const go = (id: string) => {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
    setTimeout(() => {
      document
        .getElementById("seccion-activa")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <section className="relative py-8 sm:py-12">
      {/* Tab bar */}
      <div className="sticky top-0 z-30 mb-6 border-y border-[var(--red)]/15 bg-black/85 px-3 py-3 backdrop-blur-xl sm:mb-8 sm:px-6 sm:py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:justify-center sm:overflow-visible">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => go(t.id)}
                  className={`group relative flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm ${
                    isActive
                      ? "text-black"
                      : "border border-[var(--red)]/20 bg-[var(--charcoal)]/60 text-white/70 active:text-white hover:border-[var(--red)]/50 hover:text-white"
                  }`}
                  style={{
                    boxShadow: isActive
                      ? `0 10px 30px -10px ${t.color}60`
                      : undefined,
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="tab-bg"
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-[var(--red)]"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <Icon className="relative z-10 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-nav para Menú */}
      {active === "menu" && (
        <div className="mx-auto mb-8 flex max-w-6xl gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mb-10 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-6">
          {menu.map((c) => {
            const isActive = menuSub === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setMenuSub(c.id);
                  history.replaceState(null, "", `#${c.id}`);
                }}
                className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] tracking-wider uppercase transition-all sm:px-4 sm:text-xs ${
                  isActive
                    ? "border-[var(--red)] bg-[var(--red)]/15 text-white"
                    : "border-[var(--red)]/15 text-white/50 hover:border-[var(--red)]/40 hover:text-white"
                }`}
              >
                {c.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Contenido */}
      <div id="seccion-activa" className="scroll-mt-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={active === "menu" ? `menu-${menuSub}` : active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {active === "menu" && (
              <>
                <PromoBanner />
                {(() => {
                  const cat = menu.find((c) => c.id === menuSub);
                  return cat ? <MenuCategory category={cat} /> : null;
                })()}
              </>
            )}
            {active === "eventos" && <LiveEvents />}
            {active === "chef" && <ChefPick />}
            {active === "audio" && <AudioRecommendation />}
            {active === "galeria" && <Gallery />}
            {active === "juegos" && <GameZone />}
            {active === "opina" && (
              <>
                <SocialIncentive />
                <RatingSystem />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
