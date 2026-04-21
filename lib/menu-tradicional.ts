import type { MenuCategory } from "./menu-data";

/**
 * Menú Tradicional — se muestra automáticamente de 8:00 a 12:00 hrs.
 * Platos típicos de Piñas, El Oro: tigrillos, bolones, molloco y tradicionales.
 */
export const menuTradicional: MenuCategory[] = [
  {
    id: "entradas",
    title: "Entradas",
    tagline: "Para abrir el apetito",
    icon: "flame",
    sections: [
      {
        id: "entradas-trad",
        title: "Entradas",
        items: [
          { name: "Morcilla criolla a la parrilla", price: "3.50" },
          { name: "Chorizo Corte Piedra", price: "3.50" },
          { name: "Longaniza criolla a la parrilla", price: "5.00" },
          { name: "Empanaditas de viento", price: "3.00" },
          { name: "Madurito asado con queso y salprieta", price: "3.00" },
        ],
      },
    ],
  },
  {
    id: "tigrillos",
    title: "Tigrillos, Bolones & Molloco",
    tagline: "Sabores auténticos de nuestra tierra Piñas",
    icon: "flame",
    sections: [
      {
        id: "tigrillos-bolones",
        title: "Tigrillos · Bolones · Molloco",
        note: "Elige entre plátano verde o pintón.",
        items: [
          {
            name: "Tigrillo",
            price: "3.50",
            badge: "Típico",
          },
          {
            name: "Tigrillo mixto",
            price: "5.50",
            description: "Tigrillo con varios acompañantes.",
            badge: "Más pedido",
          },
          { name: "Bolón con queso", price: "3.00" },
          { name: "Bolón con chicharrón", price: "4.00" },
          { name: "Bolón mixto", price: "4.00" },
          { name: "Molloco", price: "3.00" },
        ],
      },
      {
        id: "acompanantes",
        title: "Acompañantes",
        note: "Añade lo que quieras a tu tigrillo, bolón o molloco.",
        items: [
          { name: "Carne seca con huevo", price: "3.00" },
          { name: "Longaniza", price: "3.50" },
          { name: "Morcilla", price: "3.00" },
          { name: "Pollo al grill", price: "3.00" },
          { name: "Panceta al grill", price: "3.00" },
          { name: "Queso", price: "1.00" },
          { name: "Huevo", price: "1.00" },
        ],
      },
    ],
  },
  {
    id: "tradicionales",
    title: "Tradicionales",
    tagline: "Del fuego directo a tu mesa",
    icon: "beef",
    sections: [
      {
        id: "tradicionales-main",
        title: "Tradicionales",
        items: [
          {
            name: "Lomo fino al grill",
            price: "7.00",
            description: "Lomo fino en parrilla con acompañantes.",
          },
          {
            name: "Picaña al grill",
            price: "8.00",
            description: "Corte de picaña a la parrilla.",
            badge: "Recomendado",
          },
          {
            name: "Bistec de lomo fino",
            price: "8.50",
            description: "Bistec jugoso al grill.",
          },
        ],
      },
      {
        id: "especiales-trad",
        title: "Especiales",
        note: "Todos con salsa de camarón casera.",
        items: [
          {
            name: "Bistec de camarón (clásico)",
            price: "7.50",
            description: "Bistec de lomo fino en salsa de camarón.",
            badge: "Signature",
          },
          {
            name: "Bistec de camarón (deluxe)",
            price: "7.50",
            description: "Con salsa de camarón reducida y papas chauchas.",
          },
          {
            name: "Bistec de camarón (express)",
            price: "7.00",
            description: "Porción clásica en salsa de camarón.",
          },
        ],
      },
    ],
  },
  {
    id: "mariscos",
    title: "Mariscos",
    tagline: "Del mar a la mesa",
    icon: "fish",
    sections: [
      {
        id: "ceviches-trad",
        title: "Ceviches",
        items: [
          { name: "Ceviche peruano", price: "7.50" },
          { name: "Ceviche de camarón", price: "8.50" },
          { name: "Ceviche mixto", price: "10.00" },
        ],
      },
      {
        id: "chicharrones-trad",
        title: "Chicharrones",
        items: [
          { name: "Chicharrón mixto", price: "12.00" },
          { name: "Chicharrón de camarón", price: "10.00" },
          { name: "Chicharrón de pescado", price: "8.00" },
        ],
      },
      {
        id: "arroces-trad",
        title: "Arroces",
        items: [
          { name: "Arroz con camarón", price: "9.00" },
          { name: "Arroz marinero", price: "12.00" },
        ],
      },
    ],
  },
  {
    id: "alitas-trad",
    title: "Alitas & Pop-Corn",
    tagline: "Para picar mientras esperas",
    icon: "pizza",
    sections: [
      {
        id: "alitas-trad-s",
        title: "Alitas y Pop-Corn",
        note: "Salsas: Maracuyá · Búfalo · BBQ · Honey Mustard",
        items: [
          { name: "6 alitas", price: "6.00" },
          { name: "12 alitas", price: "11.00" },
          { name: "18 alitas", price: "16.00" },
          { name: "24 alitas", price: "20.00" },
          { name: "Pop-corn de pollo", price: "6.00" },
        ],
      },
    ],
  },
  {
    id: "bebidas-trad",
    title: "Bebidas",
    tagline: "Frescas y caseras",
    icon: "cup",
    sections: [
      {
        id: "calientes-trad",
        title: "Calientes",
        items: [
          { name: "Café filtrado", price: "1.00" },
          { name: "Chocolate natural", price: "2.00" },
          { name: "Chocolate suizo", price: "3.00" },
          { name: "Horchata", price: "1.00" },
          { name: "Menta", price: "1.00" },
          { name: "Manzanilla", price: "1.00" },
          { name: "Cedrón", price: "1.00" },
          { name: "Hierba luisa", price: "1.00" },
          { name: "Manzana y canela", price: "1.00" },
        ],
      },
      {
        id: "jugos-trad",
        title: "Jugos",
        note: "Precios: vaso / jarra",
        items: [
          { name: "Maracuyá", price: "1.50 / 2.50" },
          { name: "Chicha morada", price: "1.50 / 2.50" },
          { name: "Piña", price: "1.50 / 2.50" },
          { name: "Piña coco", price: "2.00" },
          { name: "Mora", price: "1.50 / 2.50" },
          { name: "Maracumora", price: "2.00" },
        ],
      },
      {
        id: "limonadas-trad",
        title: "Limonadas",
        items: [
          { name: "Tradicional", price: "1.50" },
          { name: "Imperial", price: "2.00" },
          { name: "Coco", price: "2.50" },
          { name: "Hierbabuena", price: "2.50" },
          { name: "Rosa", price: "2.50" },
          { name: "Frozen", price: "2.00" },
        ],
      },
      {
        id: "batidos-trad",
        title: "Batidos",
        items: [
          { name: "Piña", price: "2.00" },
          { name: "Fresa", price: "2.00" },
          { name: "Melón", price: "2.00" },
          { name: "Mora", price: "2.00" },
        ],
      },
      {
        id: "gaseosas-trad",
        title: "Gaseosas & Aguas",
        items: [
          { name: "Coca 300 ml", price: "1.00" },
          { name: "Sprite 300 ml", price: "1.00" },
          { name: "Fanta 300 ml", price: "1.00" },
          { name: "Fiora 300 ml", price: "1.00" },
          { name: "Gaseosa 1 lt", price: "2.00" },
          { name: "Gaseosa 3 lt", price: "4.00" },
          { name: "Fuze Tea 500 ml", price: "1.00" },
          { name: "Fuze Tea 1 lt", price: "2.00" },
          { name: "Agua", price: "1.00" },
        ],
      },
    ],
  },
];

/**
 * Top 3 recomendados para el menú tradicional (mañana).
 */
export const TOP_PICKS_TRADICIONAL = [
  {
    name: "Tigrillo mixto",
    price: "5.50",
    image: "/dishes/tigrillo.webp",
    badge: "Más pedido",
    tagline: "Plátano + todos los acompañantes",
  },
  {
    name: "Bistec de camarón",
    price: "7.50",
    image: "/dishes/ceviche.webp",
    badge: "Signature",
    tagline: "Con salsa de camarón casera",
  },
  {
    name: "Bolón mixto",
    price: "4.00",
    image: "/dishes/tigrillo.webp",
    badge: "Típico",
    tagline: "Tradición de la tierra Piñas",
  },
];
