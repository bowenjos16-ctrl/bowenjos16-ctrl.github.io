export const CONFIG = {
  name: "Corte Piedra",
  tagline: "Parrilla & Mariscos",
  established: "2024",
  city: "Piñas, El Oro · Ecuador",
  address: "Ciudadela San Francisco, Avenida Kennedy, junto a la Urna",

  // Número único para reservas
  whatsapp: "593980687349",
  whatsappDisplay: "+593 98 068 7349",

  instagram: "cortepiedra.rest",
  instagramUrl:
    "https://www.instagram.com/cortepiedra.rest?igsh=MTlqOTllZWIxN2Vrbg==",

  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(
      "Corte Piedra, Ciudadela San Francisco, Av. Kennedy, Piñas, El Oro, Ecuador",
    ),

  // URL de Google para dejar reseña pública
  googleReviewUrl:
    "https://search.google.com/local/writereview?placeid=0x90335f9d6bb982b3:0x389b9d01da8c1b0e",

  // YouTube video ID para fondo del hero (drone de Piñas)
  heroVideoId: "LoEBnNiXRo4",
  heroVideoStart: 0,
  heroVideoEnd: 20,

  topPicks: [
    "Tomahawk",
    "Carrusel de mariscos",
    "Picadita Corte Piedra Mixta",
  ],

  /**
   * Promociones rotativas según el día de la semana.
   * Indexadas por getDay(): 0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado.
   * Martes (2) = null porque el restaurante está cerrado ese día.
   *
   * offerType:
   *  - "combo" → muestra "X x $Y" (ej: "2 x $12.50")
   *  - "discount" → muestra "X% OFF" en porcentaje
   */
  promosByDay: [
    // 0 — DOMINGO
    {
      title: "Domingo de mariscos",
      description: "10% de descuento en todos los mariscos del menú.",
      offerType: "discount" as const,
      discountPct: 10,
      subtitle: "en mariscos",
      bgImage: "/dishes/ceviche.webp",
    },
    // 1 — LUNES
    {
      title: "Lunes de Grilles",
      description: "Lleva 2 platos de Grilles y aprovecha el especial del día.",
      offerType: "combo" as const,
      qty: 2,
      pricePerItem: 12.5,
      subtitle: "en Grilles",
      bgImage: "/dishes/grill-hero.webp",
    },
    // 2 — MARTES (cerrado)
    null,
    // 3 — MIÉRCOLES
    {
      title: "Miércoles de Costillas",
      description: "2 platos de costillas premium a precio especial.",
      offerType: "combo" as const,
      qty: 2,
      pricePerItem: 30.0,
      subtitle: "en Costillas",
      bgImage: "/dishes/grill-hero.webp",
    },
    // 4 — JUEVES
    {
      title: "Jueves de Ribeyes",
      description: "Doble corte Ribeye a precio especial.",
      offerType: "combo" as const,
      qty: 2,
      pricePerItem: 26.0,
      subtitle: "en Ribeyes",
      bgImage: "/dishes/grill-hero.webp",
    },
    // 5 — VIERNES
    {
      title: "Viernes de Cócteles",
      description: "3 cócteles seleccionados a $10 c/u — perfecto para arrancar el finde.",
      offerType: "combo" as const,
      qty: 3,
      pricePerItem: 10.0,
      subtitle: "en cócteles seleccionados",
      bgImage: "/dishes/cocktails.webp",
    },
    // 6 — SÁBADO
    {
      title: "Sábado de Micheladas",
      description: "3 micheladas heladas por $5 c/u — refresca tu finde.",
      offerType: "combo" as const,
      qty: 3,
      pricePerItem: 5.0,
      subtitle: "en Micheladas",
      bgImage: "/dishes/micheladas.webp",
    },
  ],
  happyHour: {
    startHour: 17,
    endHour: 19,
    discount: "2x1 en mojitos",
  },

  // Eventos en vivo
  liveEvents: [
    {
      day: 5,
      title: "Viernes de Karaoke",
      subtitle: "Abre tus cuerdas vocales con un cóctel en mano",
      startHour: 20,
      endHour: 24,
      icon: "mic",
      color: "#c73838",
    },
    {
      day: 6,
      title: "DJ en vivo",
      subtitle: "La mejor música para una noche de parrilla",
      startHour: 21,
      endHour: 2,
      icon: "music",
      color: "#c9a35a",
    },
    {
      day: 4,
      title: "Jueves gastronómico",
      subtitle: "Maridajes especiales con el chef",
      startHour: 19,
      endHour: 23,
      icon: "chef-hat",
      color: "#8b2323",
    },
  ],

  // Apps Script Web App URL (para ratings)
  ratingEndpoint:
    "https://script.google.com/macros/s/AKfycbwCtVgUP-7b2p2GiObXw7KbAVSW0l06Y5F-ymw5Gm9RTfY9GR2cwBSBqvekFNBbfU_n/exec",
  // GitHub Pages: llamamos directo al Apps Script Web App.
  // El Content-Type text/plain en lib/loyalty.ts evita el preflight CORS
  // (Apps Script acepta el body como JSON en string).
  loyaltyApi:
    "https://script.google.com/macros/s/AKfycbwCtVgUP-7b2p2GiObXw7KbAVSW0l06Y5F-ymw5Gm9RTfY9GR2cwBSBqvekFNBbfU_n/exec",

  // Juegos: 1 partida por login con cooldown
  gameCooldownHours: 10,

  chef: {
    name: "Chef Corte Piedra",
    role: "Cocina de autor · Desde 2024",
    bio: "Cada plato en Corte Piedra nace del respeto al producto. Seleccionamos cortes premium de res Brangus y cerdo Yorkshire canadiense, trabajamos mariscos del día y preparamos todas nuestras salsas desde cero. Queremos que cada visita sea un encuentro alrededor de una buena mesa.",
    signature: "Salmón en salsa de naranja",
  },
};

/**
 * Links de WhatsApp — usado SOLO en puntos clave: reservas desde eventos y footer.
 * El mensaje se orienta a reservar mesa, no a tomar pedido.
 */
export function waReservation(detail?: string) {
  const base =
    "Hola Corte Piedra 👋 Quiero hacer una reserva" +
    (detail ? ` · ${detail}` : ".");
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(base)}`;
}

export function waGeneralLink(
  msg = "Hola Corte Piedra 👋 Quiero hacer una reserva.",
) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
}

// Alias legacy para compatibilidad con componentes que aún lo usan internamente.
export function waLink(productName: string, price?: string) {
  const msg = price
    ? `Hola Corte Piedra 👋 Quiero reservar y me interesa:\n\n• ${productName} — $${price}`
    : `Hola Corte Piedra 👋 Quiero reservar y me interesa:\n\n• ${productName}`;
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
}

export const ITEM_TAGS: Record<string, string> = {
  Tomahawk: "Más vendido",
  "Picadita Corte Piedra Mixta": "Ideal para compartir",
  "Carrusel de mariscos": "Perfecto para 2",
  "Hamburguesa Corte Piedra": "Favorito de clientes",
  "Tuétano con camarón y pan de ajo": "Signature",
  "Filet mignon en salsa de champiñones": "Recomendado del chef",
  "Matambre pizza": "Nuevo",
  "Mojito frutos rojos": "Más pedido",
  "Salmón en salsa de naranja": "Premium",
  "Chicharrón mixto": "Clásico",
  "Ceviche mixto": "Recomendado",
};
