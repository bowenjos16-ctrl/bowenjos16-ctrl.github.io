"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import type { MenuItem } from "@/lib/menu-data";
import { ITEM_TAGS } from "@/lib/config";

const SUGGESTIONS: Record<string, string> = {
  Tomahawk: "Acompáñalo con una copa Casillero Cabernet",
  "Hamburguesa Corte Piedra": "Agrégale unas alitas BBQ",
  "Picadita Corte Piedra Mixta": "Ideal con una jarra de sangría",
  "Carrusel de mariscos": "Perfecto con ceviche peruano extra",
  "Salmón en salsa de naranja": "Combina con una limonada de coco",
  "Ceviche mixto": "Acompaña con chicharrón de camarón",
  "New York": "Marida con copa Casillero Merlot",
  "Rib-eye": "Sugerencia: papa chaucha y choclo con queso",
};

export default function MenuItemCard({
  item,
  index,
}: {
  item: MenuItem;
  index: number;
}) {
  const badge = item.badge ?? ITEM_TAGS[item.name];
  const suggestion = SUGGESTIONS[item.name];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.6,
        delay: index * 0.05,
        ease: [0.23, 1, 0.32, 1],
      }}
      className="group relative py-4"
    >
      {item.image && (
        <div className="relative mb-3 aspect-[16/10] w-full overflow-hidden rounded-lg ring-1 ring-white/10">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 600px"
            unoptimized
          />
        </div>
      )}
      <div className="flex items-baseline gap-2">
        <div className="flex flex-1 items-baseline">
          <h4 className="font-serif text-lg text-white transition-colors group-hover:text-[var(--red-bright)] sm:text-xl">
            {item.name}
          </h4>
          {badge && (
            <motion.span
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + index * 0.05, type: "spring" }}
              className="tag-badge ml-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase"
            >
              <Sparkles className="h-2.5 w-2.5" />
              {badge}
            </motion.span>
          )}
          <span className="dotted-leader" />
        </div>
        {item.price && (
          <span className="price-tag text-lg sm:text-xl">${item.price}</span>
        )}
      </div>
      {item.description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
          {item.description}
        </p>
      )}
      {suggestion && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-2 flex items-center gap-1.5 text-xs text-[var(--red)]/80 italic"
        >
          <span className="inline-block h-1 w-1 rounded-full bg-[var(--red)]" />
          {suggestion}
        </motion.p>
      )}
    </motion.div>
  );
}
