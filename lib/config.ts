export const CONFIG = {
  name: "Corte Piedra",
  tagline: "Parrilla & Mariscos",
  established: "2024",
  city: "Piñas, El Oro · Ecuador",

  whatsapp: "593968429494",
  whatsappDisplay: "+593 96 842 9494",
  instagram: "cortepiedra",
  instagramUrl: "https://instagram.com/cortepiedra",
  mapsUrl: "https://maps.google.com/?q=Corte+Piedra+Restaurante+Piñas+Ecuador",
  // URL de Google para dejar reseña pública
  googleReviewUrl: "https://search.google.com/local/writereview?placeid=CORTE_PIEDRA_PLACE_ID",

  // YouTube video ID para fondo del hero (drone de Piñas)
  // Reemplaza con el ID real (parte después de v=), ej: "dQw4w9WgXcQ"
  heroVideoId: "",

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

  // Eventos en vivo — editable
  liveEvents: [
    {
      day: 5, // 0=Dom, 1=Lun, ..., 5=Viernes, 6=Sáb
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

  // URL pública del Google Apps Script Web App que recibe los ratings
  // Deploy instructions en /docs/apps-script.md
  ratingEndpoint: "",

  // Chef info
  chef: {
    name: "Chef Corte Piedra",
    role: "Cocina de autor · Desde 2024",
    bio: "Cada plato en Corte Piedra nace del respeto al producto. Seleccionamos cortes premium de res Brangus y cerdo Yorkshire canadiense, trabajamos mariscos del día y preparamos todas nuestras salsas desde cero. Queremos que cada visita sea un encuentro alrededor de una buena mesa.",
    signature: "Salmón en salsa de naranja",
  },
};

export function waLink(productName: string, price?: string) {
  const msg = price
    ? `Hola Corte Piedra 👋 Quiero pedir:\n\n• ${productName} — $${price}\n\n¿Me confirman disponibilidad?`
    : `Hola Corte Piedra 👋 Quiero pedir:\n\n• ${productName}\n\n¿Me confirman disponibilidad?`;
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
}

export function waGeneralLink(
  msg = "Hola Corte Piedra 👋 Quiero hacer un pedido.",
) {
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
