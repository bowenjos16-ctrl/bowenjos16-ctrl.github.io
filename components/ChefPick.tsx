"use client";

import { motion } from "framer-motion";
import { ChefHat, Quote, PlayCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { CONFIG, waLink } from "@/lib/config";

export default function ChefPick() {
  const [playVideo, setPlayVideo] = useState(false);

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="grid gap-10 md:grid-cols-2 md:items-center"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            {!playVideo ? (
              <>
                <Image
                  src="/dishes/salmon.webp"
                  alt={CONFIG.chef.signature}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                <div className="absolute top-6 left-6 flex items-center gap-2 rounded-full bg-[var(--red)] px-4 py-2 text-xs font-bold tracking-widest text-[var(--background)] uppercase">
                  <ChefHat className="h-4 w-4" />
                  Del Chef
                </div>
                <button
                  onClick={() => setPlayVideo(true)}
                  className="group absolute inset-0 flex items-center justify-center"
                  aria-label="Ver mensaje del chef"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--background)]/60 backdrop-blur-md transition-all group-hover:bg-[var(--red)]/80"
                  >
                    <PlayCircle className="h-10 w-10 text-[white]" />
                  </motion.div>
                </button>
              </>
            ) : (
              <div className="relative h-full w-full bg-[var(--charcoal)]">
                {/* Video placeholder — reemplaza heroVideoId o añade chefVideoId al config */}
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                  <ChefHat className="mb-6 h-16 w-16 text-[var(--red)]" />
                  <p className="font-serif text-xs tracking-[0.3em] text-[var(--red)]/80 uppercase">
                    Mensaje del chef
                  </p>
                  <h3 className="red-gradient mt-4 font-serif text-3xl font-black">
                    {CONFIG.chef.name}
                  </h3>
                  <p className="mt-6 text-balance text-base leading-relaxed text-[var(--foreground)]/80 italic">
                    &ldquo;{CONFIG.chef.bio}&rdquo;
                  </p>
                  <button
                    onClick={() => setPlayVideo(false)}
                    className="mt-8 text-xs tracking-widest text-[white]/70 uppercase underline underline-offset-4"
                  >
                    ← Volver a la foto
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-[var(--red)]/80">
              <Quote className="h-5 w-5" />
              <span className="font-serif text-xs tracking-[0.3em] uppercase">
                Plato firma
              </span>
            </div>
            <h2 className="red-gradient font-serif text-4xl font-black tracking-tight sm:text-5xl">
              {CONFIG.chef.signature}
            </h2>
            <p className="mt-5 text-balance text-lg leading-relaxed text-[var(--foreground)]/75 italic">
              &ldquo;Es el plato que siempre pido de regreso al pase. La
              acidez de la naranja corta la grasa del salmón y las papitas
              chauchas salteadas le dan textura. Una combinación que define
              nuestra cocina.&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--red)] to-[var(--red-deep)]">
                <ChefHat className="h-5 w-5 text-[white]" />
              </div>
              <div>
                <p className="font-serif text-sm font-bold text-[white]">
                  {CONFIG.chef.name}
                </p>
                <p className="text-xs text-[var(--foreground)]/50">
                  {CONFIG.chef.role}
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span className="price-tag text-3xl">$15.00</span>
              <a
                href={waLink(CONFIG.chef.signature, "15.00")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#25D366]/20 transition-transform hover:scale-105"
              >
                Pedir por WhatsApp
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
