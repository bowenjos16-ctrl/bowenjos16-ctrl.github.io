"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { MenuKind } from "@/lib/menu-schedule";
import { getMenuKindByHour } from "@/lib/menu-schedule";

type ThemeCtx = {
  theme: "morning" | "evening";
  menuKind: MenuKind;
  setMenuKind: (k: MenuKind) => void;
  currentKind: MenuKind; // el vigente por horario
};

const Ctx = createContext<ThemeCtx>({
  theme: "evening",
  menuKind: "regular",
  setMenuKind: () => {},
  currentKind: "regular",
});

export function useTheme() {
  return useContext(Ctx);
}

/**
 * Provee el menú activo y aplica data-theme al <html>
 * - morning = verde (menú tradicional 8:00-16:00)
 * - evening = rojo (menú principal 16:00-22:00)
 */
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentKind, setCurrentKind] = useState<MenuKind>("regular");
  const [menuKind, setMenuKind] = useState<MenuKind>("regular");

  // Detectar hora actual cada minuto
  useEffect(() => {
    const sync = () => {
      const kind = getMenuKindByHour(new Date().getHours());
      setCurrentKind(kind);
      setMenuKind((prev) => (prev === kind ? prev : kind));
    };
    sync();
    const id = setInterval(sync, 60_000);
    return () => clearInterval(id);
  }, []);

  // Aplicar data-theme al documento
  useEffect(() => {
    const theme = menuKind === "tradicional" ? "morning" : "evening";
    document.documentElement.dataset.theme = theme;
    // Update meta theme-color for navigator chrome
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", "#000000");
    }
  }, [menuKind]);

  const theme = menuKind === "tradicional" ? "morning" : "evening";

  return (
    <Ctx.Provider value={{ theme, menuKind, setMenuKind, currentKind }}>
      {children}
    </Ctx.Provider>
  );
}
