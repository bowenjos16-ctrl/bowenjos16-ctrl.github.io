import { menu as menuRegular } from "./menu-data";
import { menuTradicional } from "./menu-tradicional";
import type { MenuCategory } from "./menu-data";

export type MenuKind = "tradicional" | "regular";

export const MENU_SCHEDULE = {
  tradicional: {
    kind: "tradicional" as const,
    label: "Menú Tradicional",
    subtitle: "Desayunos y típicos de Piñas",
    startHour: 8,
    endHour: 16,
    scheduleLabel: "8:00 - 16:00 h",
    description:
      "Los sabores auténticos de nuestra querida tierra Piñas. Tigrillos, bolones, molloco y tradicionales — pensado para los amantes de la rica y verdadera comida típica de nuestra región.",
    data: menuTradicional,
  },
  regular: {
    kind: "regular" as const,
    label: "Menú Principal",
    subtitle: "Parrilla, mariscos y bar",
    startHour: 16,
    endHour: 22, // hasta las 10 PM
    scheduleLabel: "16:00 - 22:00 h",
    description:
      "Cortes premium de res Brangus y cerdo Yorkshire canadiense, mariscos frescos, picaditas y bar completo. La experiencia completa de Corte Piedra.",
    data: menuRegular,
  },
} as const;

/**
 * Devuelve qué menú corresponde según la hora local del navegador.
 * Menú Tradicional: 8:00 - 16:00 (8am - 4pm)
 * Menú Principal: 16:00 - 22:00 (4pm - 10pm)
 * Si la hora está fuera de ambos rangos (22:00-8:00), muestra el regular.
 */
export function getMenuKindByHour(hour: number): MenuKind {
  if (hour >= 8 && hour < 16) return "tradicional";
  return "regular";
}

export function getActiveMenu(now = new Date()): {
  kind: MenuKind;
  info: typeof MENU_SCHEDULE[MenuKind];
  data: MenuCategory[];
} {
  const kind = getMenuKindByHour(now.getHours());
  const info = MENU_SCHEDULE[kind];
  return { kind, info, data: info.data };
}
