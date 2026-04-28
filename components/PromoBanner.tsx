"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Clock, Flame } from "lucide-react";
import Image from "next/image";
import { CONFIG } from "@/lib/config";

function useCountdown(targetHour: number) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(targetHour, 0, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      let diff = Math.max(0, target.getTime() - now.getTime());
      const h = Math.floor(diff / 3600000);
      diff -= h * 3600000;
      const m = Math.floor(diff / 60000);
      diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      setTime({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetHour]);

  return time;
}

export default function PromoBanner() {
  // getDay() devuelve 0=Domingo ... 6=Sábado, igual que el array CONFIG.promosByDay
  const today = new Date().getDay();
  const p = CONFIG.promosByDay[today];
  const timer = useCountdown(23); // Termina a medianoche

  // Martes (2) o cualquier día sin promo → no renderizar
  if (!p) return null;

  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="red-border relative overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-0">
            <Image
              src={p.bgImage}
              alt=""
              fill
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/80 to-transparent" />
          </div>

          <div className="relative z-10 grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--ember)] to-[#ff9d3a] px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase"
                >
                  <Flame className="h-3 w-3" />
                  Solo Hoy
                </motion.span>
                <span className="font-serif text-xs tracking-[0.3em] text-[var(--red)] uppercase">
                  Promo del día
                </span>
              </div>
              <h3 className="red-gradient font-serif text-3xl font-black sm:text-4xl">
                {p.title}
              </h3>
              <p className="mt-2 max-w-md text-[var(--foreground)]/70">
                {p.description}
              </p>

              {/* Precio según tipo de oferta */}
              <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {p.offerType === "combo" && (
                  <>
                    <span className="price-tag text-3xl">
                      {p.qty} x ${p.pricePerItem.toFixed(2)}
                    </span>
                    <span className="rounded-md bg-[var(--red)] px-2 py-0.5 text-xs font-bold tracking-wider text-white uppercase">
                      {p.subtitle}
                    </span>
                  </>
                )}
                {p.offerType === "discount" && (
                  <>
                    <span className="price-tag text-3xl">
                      {p.discountPct}% OFF
                    </span>
                    <span className="rounded-md bg-[var(--red)] px-2 py-0.5 text-xs font-bold tracking-wider text-white uppercase">
                      {p.subtitle}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 md:items-end">
              <div className="flex items-center gap-2 text-[white]">
                <Clock className="h-4 w-4" />
                <span className="font-serif text-xs tracking-widest uppercase">
                  Termina en
                </span>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "Horas", value: timer.h },
                  { label: "Min", value: timer.m },
                  { label: "Seg", value: timer.s },
                ].map((u) => (
                  <div
                    key={u.label}
                    className="flex flex-col items-center rounded-xl border border-[var(--red)]/30 bg-[var(--charcoal)]/60 px-3 py-2 backdrop-blur"
                  >
                    <span className="font-serif text-2xl font-bold text-[white] tabular-nums">
                      {String(u.value).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] tracking-widest text-[var(--foreground)]/50 uppercase">
                      {u.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-full bg-[var(--red)]/15 border border-[var(--red)]/40 px-5 py-2.5 text-xs font-bold tracking-wider text-white uppercase">
                <span>Pide en la mesa</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
