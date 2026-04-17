"use client";

import { motion } from "framer-motion";
import { Instagram, Wifi, MapPin, MessageCircle, Phone } from "lucide-react";
import Logo from "./Logo";
import { CONFIG, waGeneralLink } from "@/lib/config";

export default function Footer() {
  const links = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: CONFIG.whatsappDisplay,
      href: waGeneralLink(),
      color: "#25D366",
    },
    {
      icon: Instagram,
      label: "Instagram",
      value: `@${CONFIG.instagram}`,
      href: CONFIG.instagramUrl,
      color: "#E4405F",
    },
    {
      icon: MapPin,
      label: "Cómo llegar",
      value: "Google Maps",
      href: CONFIG.mapsUrl,
      color: "#c8202e",
    },
    {
      icon: Wifi,
      label: "Red Wi-Fi",
      value: "Pide al mesero",
      href: null,
      color: "#c8202e",
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-[var(--red)]/20 py-20">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto flex justify-center flame-flicker drop-shadow-[0_0_20px_rgba(200,32,46,0.25)]"
        >
          <Logo variant="stacked" width={220} className="h-auto w-[min(70vw,220px)]" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 font-serif text-base text-[var(--red)] italic"
        >
          Experiencia Gourmet en Cada Bocado
        </motion.p>

        <motion.a
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          href={waGeneralLink()}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-8 py-4 text-sm font-bold tracking-widest text-white uppercase shadow-lg shadow-[#25D366]/30 transition-transform hover:scale-105"
        >
          <Phone className="h-4 w-4" />
          Pedir por WhatsApp
        </motion.a>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {links.map((l) => {
            const Icon = l.icon;
            const Wrapper = (l.href ? "a" : "div") as "a" | "div";
            const props = l.href
              ? { href: l.href, target: "_blank", rel: "noreferrer" }
              : {};
            return (
              <Wrapper
                key={l.label}
                {...props}
                className={`red-border group rounded-2xl p-5 transition-all ${
                  l.href ? "cursor-pointer hover:bg-white/5" : ""
                }`}
              >
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: l.color }} />
                  <span className="font-sans text-[10px] font-bold tracking-[0.3em] text-white/70 uppercase">
                    {l.label}
                  </span>
                </div>
                <p className="font-serif text-base text-white transition-colors group-hover:text-[var(--red-bright)]">
                  {l.value}
                </p>
              </Wrapper>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 flex items-center justify-center gap-4"
        >
          <span className="h-px w-20 bg-[var(--red)]/40" />
          <span className="font-serif text-xs tracking-[0.3em] text-white/50 italic uppercase">
            Gracias por ser parte de nuestra historia
          </span>
          <span className="h-px w-20 bg-[var(--red)]/40" />
        </motion.div>
      </div>
    </footer>
  );
}
