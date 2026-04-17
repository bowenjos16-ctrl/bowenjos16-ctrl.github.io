"use client";

import { motion } from "framer-motion";
import type { MenuCategory as MenuCategoryType } from "@/lib/menu-data";
import { SIDES_NOTE } from "@/lib/menu-data";
import CategoryHeader from "./CategoryHeader";
import MenuSection from "./MenuSection";

export default function MenuCategory({
  category,
}: {
  category: MenuCategoryType;
}) {
  const showSides = ["cortes", "grill"].includes(category.id);
  return (
    <section
      id={category.id}
      className="relative scroll-mt-24 border-t border-[var(--red)]/10 py-24"
    >
      <div className="mx-auto max-w-5xl px-6">
        <CategoryHeader
          title={category.title}
          tagline={category.tagline}
        />
        <div className="grid gap-x-16 gap-y-4 md:grid-cols-2">
          {category.sections.map((s) => (
            <MenuSection key={s.id} section={s} />
          ))}
        </div>
        {showSides && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="red-border mt-10 rounded-2xl p-6 text-center"
          >
            <p className="font-serif text-xs tracking-[0.3em] text-[var(--red)] uppercase">
              Incluye · Guarniciones (elige 2)
            </p>
            <p className="mt-2 text-sm text-[var(--foreground)]/70">
              {SIDES_NOTE}
            </p>
            <p className="mt-3 font-serif text-xs text-[var(--foreground)]/50 italic">
              Cortes: ensalada fresca, vegetales salteados y salsas incluidos.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
