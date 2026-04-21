"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sparkles, Sun, Flame } from "lucide-react";
import { MENU_SCHEDULE, type MenuKind } from "@/lib/menu-schedule";

export default function MenuSwitcher({
  active,
  current,
  onChange,
}: {
  active: MenuKind;
  current: MenuKind;
  onChange: (k: MenuKind) => void;
}) {
  const MENUS: { kind: MenuKind; Icon: typeof Sun }[] = [
    { kind: "tradicional", Icon: Sun },
    { kind: "regular", Icon: Flame },
  ];

  return (
    <div className="mx-auto mb-8 max-w-2xl px-4 sm:px-6">
      {/* Badge de horario activo */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 flex items-center justify-center gap-2 text-[11px] tracking-widest text-white/50 uppercase"
      >
        <Clock className="h-3 w-3 text-[var(--red)]" />
        <span>
          Ahora sirviendo:{" "}
          <span className="font-bold text-white">
            {MENU_SCHEDULE[current].label}
          </span>
          <span className="ml-1 text-[var(--red)]">
            · {MENU_SCHEDULE[current].scheduleLabel}
          </span>
        </span>
      </motion.div>

      {/* Toggle */}
      <div className="red-border relative mx-auto flex w-full max-w-sm items-center rounded-full p-1">
        {MENUS.map(({ kind, Icon }) => {
          const isActive = active === kind;
          const isCurrent = current === kind;
          const info = MENU_SCHEDULE[kind];
          return (
            <button
              key={kind}
              onClick={() => onChange(kind)}
              className={`relative z-10 flex-1 rounded-full px-3 py-2 text-[11px] font-bold tracking-wider uppercase transition-colors sm:text-xs ${
                isActive ? "text-black" : "text-white/70 hover:text-white"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="menu-switch-bg"
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-[var(--red)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {info.label.replace("Menú ", "")}
                {isCurrent && !isActive && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--red)] opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--red)]" />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mensaje si el usuario ve un menú fuera de horario */}
      <AnimatePresence mode="wait">
        {active !== current && (
          <motion.p
            key={active}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] tracking-wide text-[var(--red)]/80 sm:text-[11px]"
          >
            <Sparkles className="h-3 w-3" />
            Vista previa · disponible de {MENU_SCHEDULE[active].scheduleLabel}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
