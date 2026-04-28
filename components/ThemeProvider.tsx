"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { MenuKind } from "@/lib/menu-schedule";
import { getMenuKindByHour } from "@/lib/menu-schedule";
import type { MenuCategory } from "@/lib/menu-data";
import { fetchMenu, refreshMenu } from "@/lib/menu-api";
import type { EventsPayload } from "@/lib/events-api";
import { fetchEvents, refreshEvents } from "@/lib/events-api";
import type { GalleryPayload } from "@/lib/gallery-api";
import { fetchGallery, refreshGallery } from "@/lib/gallery-api";

type LiveMenus = {
  regular: MenuCategory[] | null;
  tradicional: MenuCategory[] | null;
};

type ThemeCtx = {
  theme: "morning" | "evening";
  menuKind: MenuKind;
  setMenuKind: (k: MenuKind) => void;
  currentKind: MenuKind; // el vigente por horario
  liveMenus: LiveMenus;
  refreshMenus: () => Promise<void>;
  liveEvents: EventsPayload | null;
  refreshEvents: () => Promise<void>;
  liveGallery: GalleryPayload | null;
  refreshGallery: () => Promise<void>;
};

const Ctx = createContext<ThemeCtx>({
  theme: "evening",
  menuKind: "regular",
  setMenuKind: () => {},
  currentKind: "regular",
  liveMenus: { regular: null, tradicional: null },
  refreshMenus: async () => {},
  liveEvents: null,
  refreshEvents: async () => {},
  liveGallery: null,
  refreshGallery: async () => {},
});

export function useTheme() {
  return useContext(Ctx);
}

/**
 * Provee el menú activo y aplica data-theme al <html>
 * - morning = verde (menú tradicional 8:00-16:00)
 * - evening = rojo (menú principal 16:00-22:00)
 *
 * También obtiene los menús "live" desde Apps Script (Google Sheets) en background.
 * Si la API falla, los componentes usan los datos estáticos como fallback.
 */
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentKind, setCurrentKind] = useState<MenuKind>("regular");
  const [menuKind, setMenuKind] = useState<MenuKind>("regular");
  const [liveMenus, setLiveMenus] = useState<LiveMenus>({
    regular: null,
    tradicional: null,
  });
  const [liveEvents, setLiveEvents] = useState<EventsPayload | null>(null);
  const [liveGallery, setLiveGallery] = useState<GalleryPayload | null>(null);

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
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", "#000000");
    }
  }, [menuKind]);

  // Cargar menús + eventos + galería live (Sheets) — al montar y cada 30 min
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [regular, tradicional, events, gallery] = await Promise.all([
        fetchMenu("regular"),
        fetchMenu("tradicional"),
        fetchEvents(),
        fetchGallery(),
      ]);
      if (cancelled) return;
      setLiveMenus({ regular, tradicional });
      if (events) setLiveEvents(events);
      if (gallery) setLiveGallery(gallery);
    };
    void load();
    const id = setInterval(load, 30 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const refreshMenus = useCallback(async () => {
    const [regular, tradicional] = await Promise.all([
      refreshMenu("regular"),
      refreshMenu("tradicional"),
    ]);
    setLiveMenus({ regular, tradicional });
  }, []);

  const refreshEventsCb = useCallback(async () => {
    const events = await refreshEvents();
    if (events) setLiveEvents(events);
  }, []);

  const refreshGalleryCb = useCallback(async () => {
    const gallery = await refreshGallery();
    if (gallery) setLiveGallery(gallery);
  }, []);

  const theme = menuKind === "tradicional" ? "morning" : "evening";

  return (
    <Ctx.Provider
      value={{
        theme,
        menuKind,
        setMenuKind,
        currentKind,
        liveMenus,
        refreshMenus,
        liveEvents,
        refreshEvents: refreshEventsCb,
        liveGallery,
        refreshGallery: refreshGalleryCb,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
