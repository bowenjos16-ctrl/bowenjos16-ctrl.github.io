"use client";

import { motion } from "framer-motion";
import { User, Star } from "lucide-react";
import { useLoyalty } from "./LoyaltyProvider";

export default function LoyaltyButton() {
  const { client, openModal } = useLoyalty();

  const initial = client?.nombre?.charAt(0).toUpperCase() || "";
  const levelColor =
    client?.nivel === "Oro"
      ? "from-[#ffd966] to-[#a67c00]"
      : client?.nivel === "Plata"
        ? "from-[#e5e5e5] to-[#9ca3af]"
        : "from-[#c8202e] to-[#8b1621]";

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, type: "spring" }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={openModal}
      aria-label={client ? `Mi cuenta · ${client.nombre}` : "Iniciar sesión"}
      className="fixed top-4 right-16 z-40 flex h-10 items-center gap-2 md:top-5 md:right-20"
    >
      {client ? (
        <>
          {/* Badge con puntos (oculto en móvil muy pequeño) */}
          <span className="hidden rounded-full border border-[var(--red)]/40 bg-black/70 px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur sm:inline-flex">
            <Star className="mr-1 inline-block h-3 w-3 fill-current text-[var(--red-bright)]" />
            {client.puntos_actuales} pts
          </span>
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${levelColor} font-serif text-sm font-bold text-white shadow-lg shadow-black/40 ring-2 ring-black`}
            title={`${client.nombre} · ${client.nivel}`}
          >
            {initial}
          </span>
        </>
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--red)]/40 bg-[var(--charcoal)]/80 text-white backdrop-blur transition-colors hover:bg-[var(--red)]/20">
          <User className="h-4 w-4" />
        </span>
      )}
    </motion.button>
  );
}
