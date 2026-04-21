"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Mic,
  Music,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Radio,
} from "lucide-react";
import { CONFIG, waGeneralLink } from "@/lib/config";

const ICONS = { mic: Mic, music: Music, "chef-hat": ChefHat };
const DAY_LETTERS = ["D", "L", "M", "M", "J", "V", "S"];
const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type EventDef = (typeof CONFIG.liveEvents)[number];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const firstDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function LiveEvents() {
  const [today, setToday] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });
  const [selected, setSelected] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setSelected(now);
    setViewMonth({ year: now.getFullYear(), month: now.getMonth() });
  }, []);

  const weeks = useMemo(
    () => buildMonthGrid(viewMonth.year, viewMonth.month),
    [viewMonth],
  );

  const eventsForDay = (date: Date): EventDef[] =>
    CONFIG.liveEvents.filter((e) => e.day === date.getDay());

  const isToday = (d: Date | null) => d && today && sameDay(d, today);
  const isSelected = (d: Date | null) => d && selected && sameDay(d, selected);

  const selectedEvents = selected ? eventsForDay(selected) : [];

  const shift = (delta: number) => {
    setViewMonth((v) => {
      const m = v.month + delta;
      if (m < 0) return { year: v.year - 1, month: 11 };
      if (m > 11) return { year: v.year + 1, month: 0 };
      return { year: v.year, month: m };
    });
  };

  if (!today) return null;

  return (
    <section id="eventos" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-serif text-xs tracking-[0.5em] text-[var(--red)]/80 uppercase"
          >
            Agenda
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="red-gradient mt-3 font-serif text-4xl font-black sm:text-5xl"
          >
            Eventos en vivo
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-sm text-white/60 sm:text-base"
          >
            Cada noche tiene su plan en Corte Piedra
          </motion.p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-10">
          {/* CALENDARIO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="red-border rounded-3xl p-4 sm:p-6"
          >
            {/* Month header */}
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => shift(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-[var(--red)]/50 hover:text-white"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className="font-serif text-xl font-bold text-white capitalize sm:text-2xl">
                  {MONTHS[viewMonth.month]}
                </p>
                <p className="text-[10px] tracking-widest text-[var(--red)]/80 uppercase">
                  {viewMonth.year}
                </p>
              </div>
              <button
                onClick={() => shift(1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-[var(--red)]/50 hover:text-white"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day letters */}
            <div className="mb-2 grid grid-cols-7 gap-1 text-center">
              {DAY_LETTERS.map((l, i) => (
                <span
                  key={`${l}-${i}`}
                  className="text-[10px] font-bold tracking-wider text-white/40 uppercase"
                >
                  {l}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
              {weeks.flat().map((d, i) => {
                if (!d)
                  return (
                    <div key={`empty-${i}`} className="aspect-square" />
                  );
                const events = eventsForDay(d);
                const hasEvents = events.length > 0;
                const todayFlag = isToday(d);
                const selectedFlag = isSelected(d);
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => setSelected(d)}
                    className={`relative aspect-square rounded-lg text-sm font-medium transition-all sm:text-base ${
                      selectedFlag
                        ? "bg-[var(--red)] text-white shadow-lg shadow-[var(--red)]/30"
                        : todayFlag
                          ? "bg-white/10 text-white ring-1 ring-[var(--red)]/60"
                          : hasEvents
                            ? "text-white hover:bg-white/5"
                            : "text-white/30 hover:text-white/60"
                    }`}
                  >
                    <span className="relative z-10">{d.getDate()}</span>
                    {hasEvents && !selectedFlag && (
                      <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                        {events.slice(0, 3).map((e, ei) => (
                          <span
                            key={ei}
                            className="h-1 w-1 rounded-full"
                            style={{ backgroundColor: e.color }}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 border-t border-white/10 pt-4">
              {CONFIG.liveEvents.map((e) => (
                <span
                  key={e.title}
                  className="flex items-center gap-1.5 text-[10px] text-white/60"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: e.color }}
                  />
                  {e.title.replace(/^(Viernes de |Jueves )/, "")}
                </span>
              ))}
            </div>
          </motion.div>

          {/* DETALLE DEL DÍA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[10px] tracking-widest text-white/40 uppercase">
                  {isToday(selected) ? "Hoy" : "Seleccionado"}
                </p>
                <h3 className="font-serif text-2xl font-bold text-white capitalize sm:text-3xl">
                  {selected &&
                    `${DAY_NAMES[selected.getDay()]} ${selected.getDate()}`}
                </h3>
              </div>
              {isToday(selected) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--red)] px-3 py-1 text-[9px] font-bold tracking-wider text-white uppercase">
                  <Radio className="h-3 w-3" />
                  Hoy
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {selectedEvents.length > 0 ? (
                <motion.div
                  key={selected?.toISOString()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex flex-col gap-3"
                >
                  {selectedEvents.map((e, i) => {
                    const Icon =
                      ICONS[e.icon as keyof typeof ICONS] ?? Music;
                    return (
                      <motion.div
                        key={e.title}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="red-border overflow-hidden rounded-2xl p-5"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${e.color}25` }}
                          >
                            <Icon
                              className="h-6 w-6"
                              style={{ color: e.color }}
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-serif text-xl font-bold text-white">
                              {e.title}
                            </h4>
                            <p className="mt-1 text-sm text-white/70">
                              {e.subtitle}
                            </p>
                            <p className="mt-2 text-xs tracking-wider text-[var(--red)]/80">
                              {e.startHour}:00 —{" "}
                              {e.endHour === 24
                                ? "00"
                                : e.endHour < 10
                                  ? `0${e.endHour}`
                                  : e.endHour}
                              :00 h
                            </p>
                          </div>
                        </div>
                        <a
                          href={waGeneralLink(
                            `Hola Corte Piedra 👋 Quiero reservar para ${e.title} el ${DAY_NAMES[selected!.getDay()]} ${selected!.getDate()}.`,
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-xs font-bold tracking-wider text-white uppercase transition-transform hover:scale-105"
                        >
                          Reservar por WhatsApp
                        </a>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="red-border flex flex-col items-center justify-center rounded-2xl p-8 text-center"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                    <ChefHat className="h-6 w-6 text-white/40" />
                  </div>
                  <p className="text-sm text-white/60">
                    Sin eventos programados este día.
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Pero seguimos sirviendo lo mejor de nuestra carta.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
