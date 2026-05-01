"use client";

import { motion } from "framer-motion";
import type { MenuSection as MenuSectionType } from "@/lib/menu-data";
import { SIDES_NOTE } from "@/lib/menu-data";
import MenuItemCard from "./MenuItemCard";

const SECTIONS_WITH_SIDES = ["lomo-fino", "grill-simple"];

export default function MenuSection({
  section,
}: {
  section: MenuSectionType;
}) {
  const showSides = SECTIONS_WITH_SIDES.includes(section.id);
  return (
    <div className="relative mb-12">
      <motion.h3
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="mb-2 font-serif text-sm font-semibold tracking-[0.3em] text-[var(--red)] uppercase"
      >
        {section.title}
      </motion.h3>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ transformOrigin: "left" }}
        className="mb-4 h-px bg-gradient-to-r from-[var(--red)] via-[var(--red)]/40 to-transparent"
      />
      <div className="divide-y divide-[var(--red)]/10">
        {section.items.map((item, i) => (
          <MenuItemCard key={item.name} item={item} index={i} />
        ))}
      </div>
      {section.note && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-4 font-serif text-xs tracking-wider text-[var(--red)]/60 italic"
        >
          {section.note}
        </motion.p>
      )}
      {showSides && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="red-border mt-6 rounded-2xl p-5 text-center"
        >
          <p className="font-serif text-xs tracking-[0.3em] text-[var(--red)] uppercase">
            Incluye · Guarniciones (elige 2)
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">
            {SIDES_NOTE}
          </p>
        </motion.div>
      )}
    </div>
  );
}
