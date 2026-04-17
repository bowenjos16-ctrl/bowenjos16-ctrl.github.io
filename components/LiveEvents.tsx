"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Mic, Music, ChefHat, Calendar, Radio } from "lucide-react";
import { CONFIG, waGeneralLink } from "@/lib/config";

const ICONS = { mic: Mic, music: Music, "chef-hat": ChefHat };
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function LiveEvents() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const today = now.getDay();
  const todayEvent = CONFIG.liveEvents.find((e) => e.day === today);
  const isLive = !!(
    todayEvent &&
    now.getHours() >= todayEvent.startHour &&
    (todayEvent.endHour <= todayEvent.startHour
      ? now.getHours() < 24
      : now.getHours() < todayEvent.endHour)
  );

  return (
    <section id="eventos" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
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
            className="mt-3 text-[var(--foreground)]/60"
          >
            Cada noche tiene su plan en Corte Piedra
          </motion.p>
        </div>

        {todayEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-10 overflow-hidden rounded-3xl border-2 border-[var(--ember)]/40 bg-gradient-to-br from-[var(--red)]/50 to-[var(--charcoal)]"
          >
            <div className="relative p-8 sm:p-12">
              <div className="absolute top-4 right-4">
                {isLive ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ember)] px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase"
                  >
                    <Radio className="h-3 w-3" />
                    En vivo ahora
                  </motion.span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--red)]/20 px-3 py-1 text-[10px] font-bold tracking-wider text-[white] uppercase">
                    <Calendar className="h-3 w-3" />
                    Hoy
                  </span>
                )}
              </div>
              <p className="font-serif text-xs tracking-[0.3em] text-[var(--red)]/80 uppercase">
                {DAYS[todayEvent.day]} · {todayEvent.startHour}:00 h
              </p>
              <h3 className="red-gradient mt-2 font-serif text-4xl font-black sm:text-5xl">
                {todayEvent.title}
              </h3>
              <p className="mt-2 text-[var(--foreground)]/70">
                {todayEvent.subtitle}
              </p>
              <a
                href={waGeneralLink(
                  `Hola Corte Piedra 👋 Quiero reservar para ${todayEvent.title} hoy.`,
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold tracking-wider text-white uppercase shadow-lg shadow-[#25D366]/30 transition-transform hover:scale-105"
              >
                Reservar mesa
              </a>
            </div>
          </motion.div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {CONFIG.liveEvents.map((e, i) => {
            const Icon = ICONS[e.icon as keyof typeof ICONS] ?? Music;
            const isToday = e.day === today;
            return (
              <motion.div
                key={e.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -4 }}
                className={`red-border card-hover rounded-2xl p-6 ${
                  isToday ? "ring-2 ring-[var(--ember)]/50" : ""
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${e.color}30` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: e.color }} />
                  </div>
                  <span className="font-serif text-xs tracking-widest text-[var(--red)]/60 uppercase">
                    {DAYS[e.day]}
                  </span>
                </div>
                <h4 className="font-serif text-xl font-bold text-[white]">
                  {e.title}
                </h4>
                <p className="mt-1 text-sm text-[var(--foreground)]/60">
                  {e.subtitle}
                </p>
                <p className="mt-3 text-xs tracking-wider text-[var(--red)]/70">
                  {e.startHour}:00 - {e.endHour === 24 ? "00" : e.endHour < 10 ? `0${e.endHour}` : e.endHour}
                  :00 h
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
