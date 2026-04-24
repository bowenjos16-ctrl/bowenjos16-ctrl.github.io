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
    "https://search.google.com/local/writereview?placeid=CORTE_PIEDRA_PLACE_ID",

  // YouTube video ID para fondo del hero (drone de Piñas)
  heroVideoId: "LoEBnNiXRo4",
  heroVideoStart: 0,
  heroVideoEnd: 20,

  topPicks: [
    "Tomahawk",
    "Carrusel de mariscos",
    "Picadita Corte Piedra Mixta",
  ],

  promoOfDay: {
    title: "Carrusel de mariscos",
    description: "Ceviche peruano, arroz marinero, chicharrones y patacones.",
    discountPct: 15,
    originalPrice: 24,
  },
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

  // Apps Script Web App URL (único endpoint para ratings + loyalty)
  ratingEndpoint:
    "https://script.google.com/macros/s/AKfycbwCtVgUP-7b2p2GiObXw7KbAVSW0l06Y5F-ymw5Gm9RTfY9GR2cwBSBqvekFNBbfU_n/exec",
  // Usa proxy interno (/api/loyalty) para evitar bucle de redirect CORS
  // que ocurre con Apps Script en POST cross-origin desde el navegador.
  loyaltyApi: "/api/loyalty",

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
