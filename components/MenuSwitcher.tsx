"use client";

import { motion } from "framer-motion";
import { Sun, Flame } from "lucide-react";
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
  const options: {
    kind: MenuKind;
    label: string;
    short: string;
    time: string;
    Icon: typeof Sun;
  }[] = [
    {
      kind: "tradicional",
      label: "Tradicional",
      short: "8am–4pm",
      time: "8:00 — 16:00",
      Icon: Sun,
    },
    {
      kind: "regular",
      label: "Principal",
      short: "4pm–10pm",
      time: "16:00 — 22:00",
      Icon: Flame,
    },
  ];

  return (
    <div className="mx-auto mb-8 w-full max-w-md px-4 sm:px-6">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] p-1 backdrop-blur">
        {options.map((o) => {
          const isActive = active === o.kind;
          const isCurrent = current === o.kind;
          return (
            <button
              key={o.kind}
              onClick={() => onChange(o.kind)}
              aria-pressed={isActive}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-[11px] font-semibold tracking-wide uppercase transition-colors sm:text-xs ${
                isActive ? "text-black" : "text-white/65 hover:text-white"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="menu-switch-active"
                  className="absolute inset-0 rounded-full bg-white"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <o.Icon className="h-3.5 w-3.5" />
                <span>{o.label}</span>
                <span
                  className={`hidden text-[9px] font-normal tracking-normal opacity-60 sm:inline ${
                    isActive ? "text-black/70" : ""
                  }`}
                >
                  · {o.short} h
                </span>
                {isCurrent && !isActive && (
                  <span className="ml-0.5 flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-[var(--red)] opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--red)]" />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {active !== current && (
        <motion.p
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-center text-[10px] tracking-wide text-white/40"
        >
          Vista previa · se sirve {MENU_SCHEDULE[active].scheduleLabel}
        </motion.p>
      )}
    </div>
  );
}
