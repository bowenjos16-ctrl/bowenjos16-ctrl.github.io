export type MenuItem = {
  name: string;
  price?: string;
  description?: string;
  badge?: string;
};

export type MenuSection = {
  id: string;
  title: string;
  subtitle?: string;
  items: MenuItem[];
  note?: string;
};

export type MenuCategory = {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  sections: MenuSection[];
  note?: string;
};

export const SIDES_NOTE =
  "Papas · Patacones · Papa chaucha · Choclo con salsa de queso · Morochoclo · Morolenteja · Morochicharrón · Morochorizo · Arroz con menestra";

export const menu: MenuCategory[] = [
  {
    id: "entradas",
    title: "Entradas",
    tagline: "El comienzo perfecto",
    icon: "flame",
    sections: [
      {
        id: "entradas-individuales",
        title: "Entradas",
        items: [
          { name: "Morcilla criolla a la parrilla", price: "3.50" },
          { name: "Chorizo Corte Piedra", price: "3.50" },
          { name: "Longaniza criolla a la parrilla", price: "5.00" },
          { name: "Empanaditas de viento", price: "3.00" },
          { name: "Madurito asado con queso y salprieta", price: "3.00" },
        ],
      },
      {
        id: "entradas-compartir",
        title: "Para Compartir",
        items: [
          {
            name: "Tuétano con camarón y pan de ajo",
            price: "8.00",
            badge: "Signature",
          },
          { name: "Nachos con lomo fino de res", price: "9.00" },
          { name: "Nachos con pollo", price: "9.00" },
        ],
      },
    ],
  },
  {
    id: "cortes",
    title: "Cortes",
    tagline: "Res Brangus · Cerdo Yorkshire Canadiense",
    icon: "beef",
    sections: [
      {
        id: "cerdo",
        title: "Cerdo Yorkshire Canadiense",
        items: [
          { name: "Costilla ahumada", price: "18.00" },
          { name: "Baby ribs", price: "16.00" },
          { name: "Bondiola", price: "16.00" },
        ],
      },
      {
        id: "res",
        title: "Res Brangus",
        items: [
          { name: "Cow-boy", price: "16.00" },
          { name: "Matambre", price: "16.00" },
          { name: "Matambre pizza", price: "18.00" },
          { name: "Chistorra pizza", price: "16.00" },
          { name: "New York", price: "20.00" },
          { name: "Colita de cuadril", price: "17.00" },
          { name: "Biffe chorizo", price: "18.00" },
          { name: "Porter house", price: "18.00" },
          { name: "Picaña", price: "20.00" },
          { name: "Rib-eye", price: "18.00" },
          { name: "Tomahawk", price: "16.00", badge: "Chef's Choice" },
        ],
      },
    ],
    note: "Incluyen: ensalada fresca, vegetales salteados y salsas. Puede seleccionar 2 opciones de guarnición.",
  },
  {
    id: "grill",
    title: "Grill & Lomo Fino",
    tagline: "Clásicos a la parrilla",
    icon: "chef-hat",
    sections: [
      {
        id: "lomo-fino",
        title: "Lomo Fino de Res",
        items: [
          { name: "Lomo en salsa de vino tinto", price: "13.50" },
          { name: "Lomo en salsa de tocino", price: "15.00" },
          { name: "Lomo en salsa de camarón", price: "15.00" },
          { name: "Filet mignon en salsa de champiñones", price: "16.00" },
          { name: "Lomo en salsa de chimichurri", price: "15.00" },
        ],
      },
      {
        id: "grill-simple",
        title: "Grill",
        items: [
          { name: "Pollo", price: "7.50" },
          { name: "Panceta", price: "7.50" },
          { name: "Chuleta", price: "8.00" },
        ],
      },
      {
        id: "picaditas",
        title: "Picaditas",
        items: [
          {
            name: "Picadita Corte Piedra",
            price: "16.00",
            description:
              "Pollo, chuleta, panceta, chorizo, morcilla, longaniza, choclo en salsa de queso, madurito asado, ensalada fresca y salsas.",
          },
          {
            name: "Picadita Corte Piedra Mixta",
            price: "24.00",
            badge: "Premium",
            description:
              "Pollo, chuleta, panceta, chorizo, morcilla, longaniza, choclo en salsa de queso, madurito asado, chicharrón de camarón, chicharrón de pescado, ensalada fresca y salsas.",
          },
        ],
      },
    ],
  },
  {
    id: "alitas-burgers",
    title: "Alitas, Burgers & Pizza",
    tagline: "Street style elevado",
    icon: "pizza",
    sections: [
      {
        id: "alitas",
        title: "Alitas y Pop-Corn",
        items: [
          { name: "6 alitas", price: "6.00" },
          { name: "12 alitas", price: "11.00" },
          { name: "18 alitas", price: "16.00" },
          { name: "24 alitas", price: "20.00" },
          { name: "Pop-corn de pollo", price: "6.00" },
        ],
        note: "Salsas: Maracuyá · Búfalo · BBQ · Honey Mustard",
      },
      {
        id: "hamburguesas",
        title: "Hamburguesas",
        items: [
          {
            name: "Hamburguesa Americana",
            price: "6.00",
            description:
              "150 gr de lomo fino, pan de papa, queso cheddar, tocino, cebolla caramelizada, vegetales, papas crujientes y salsas.",
          },
          {
            name: "Hamburguesa Corte Piedra",
            price: "9.00",
            badge: "Signature",
            description:
              "300 gr de lomo fino, pan de papa, queso cheddar y mozzarella, tocino, chorizo, vegetales, cebolla caramelizada, papas crujientes y salsas.",
          },
        ],
      },
      {
        id: "pizza",
        title: "Pizza Artesanal",
        items: [
          {
            name: "Pizza de embutidos",
            price: "8.00",
            description:
              "Masa artesanal, salsa especial con cebolla caramelizada, mozzarella, parmesano, jamón, peperoni y albahaca.",
          },
          {
            name: "Pizza con bolognesa",
            price: "10.00",
            description:
              "Masa artesanal, salsa especial con cebolla caramelizada, mozzarella, parmesano, bolognesa, peperoni y albahaca.",
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
        id: "ceviches",
        title: "Ceviches",
        items: [
          { name: "Ceviche peruano", price: "7.50" },
          { name: "Ceviche de camarón", price: "8.50" },
          { name: "Ceviche mixto", price: "10.00" },
        ],
      },
      {
        id: "chicharrones",
        title: "Chicharrones",
        items: [
          { name: "Chicharrón mixto", price: "12.00" },
          { name: "Chicharrón de camarón", price: "10.00" },
          { name: "Chicharrón de pescado", price: "8.00" },
        ],
      },
      {
        id: "arroces",
        title: "Arroces",
        items: [
          { name: "Arroz con camarón", price: "9.00" },
          { name: "Arroz marinero", price: "12.00" },
        ],
      },
      {
        id: "mariscos-especiales",
        title: "Especiales",
        items: [
          {
            name: "Corvina en salsa de camarón",
            price: "13.50",
            description:
              "Acompañado de papitas chauchas salteadas, vegetales salteados, ensalada fresca y arroz (opcional).",
          },
          {
            name: "Salmón en salsa de naranja",
            price: "15.00",
            description:
              "Acompañado de papitas chauchas salteadas, vegetales salteados, ensalada fresca y arroz (opcional).",
          },
          {
            name: "Carrusel de mariscos",
            price: "24.00",
            badge: "Para compartir",
            description:
              "Ceviche peruano, arroz marinero, chicharrón de pescado, chicharrón de camarón, patacones y salsas.",
          },
        ],
      },
    ],
  },
  {
    id: "bebidas",
    title: "Bebidas",
    tagline: "Refrescantes y caseras",
    icon: "cup",
    sections: [
      {
        id: "calientes",
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
        id: "jugos",
        title: "Jugos",
        items: [
          { name: "Maracuyá", price: "1.50 / 2.50" },
          { name: "Chicha morada", price: "1.50 / 2.50" },
          { name: "Piña", price: "1.50 / 2.50" },
          { name: "Piña coco", price: "2.00" },
          { name: "Mora", price: "1.50 / 2.50" },
          { name: "Maracumora", price: "2.00" },
        ],
        note: "Precios: vaso / jarra",
      },
      {
        id: "limonadas",
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
        id: "gaseosas",
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
      {
        id: "milkshakes",
        title: "Milkshakes",
        items: [
          { name: "Oreo", price: "4.50" },
          { name: "Nutella", price: "4.50" },
          { name: "Vainilla", price: "4.50" },
          { name: "Fresa", price: "4.50" },
          { name: "Café", price: "4.50" },
          { name: "Menta", price: "4.50" },
        ],
      },
    ],
  },
  {
    id: "bar",
    title: "Bar",
    tagline: "Cócteles, vinos y descorches",
    icon: "wine",
    sections: [
      {
        id: "cocteles",
        title: "Cócteles",
        items: [
          { name: "Mojito clásico", price: "4.50" },
          { name: "Mojito frutos rojos", price: "6.00" },
          { name: "Mojito maracuyá", price: "5.00" },
          { name: "Margarita", price: "5.00" },
          { name: "Martini", price: "5.00" },
          { name: "Padrino", price: "6.00" },
          { name: "Tequila sunrise", price: "5.00" },
          { name: "Laguna Azul", price: "4.50" },
          { name: "Paloma", price: "5.00" },
          { name: "Mai tai", price: "6.00" },
          { name: "Caipirinha", price: "5.00" },
          { name: "Piña colada", price: "5.00" },
          { name: "Saltamontes", price: "4.50" },
          { name: "Pantera rosa", price: "5.00" },
          { name: "Dulce tentación", price: "5.00" },
        ],
      },
      {
        id: "cervezas",
        title: "Cerveza & Micheladas",
        items: [
          { name: "Club Platino", price: "2.00" },
          { name: "Corona", price: "2.50" },
          { name: "Heineken", price: "2.50" },
          { name: "Modelo", price: "3.50" },
          { name: "Michelada", price: "2.00" },
          { name: "Michelada de maracuyá", price: "2.50" },
          { name: "Chelada", price: "2.00" },
          { name: "Chelada de maracuyá", price: "2.50" },
        ],
      },
      {
        id: "vinos",
        title: "Vinos",
        items: [
          { name: "Catador", price: "4.00" },
          { name: "Copa Casillero Cabernet", price: "6.50" },
          { name: "Copa Casillero Merlot", price: "6.50" },
          { name: "Copa de sangría", price: "4.50" },
          { name: "Copa vino hervido", price: "4.50" },
          { name: "Jarra de sangría", price: "16.00" },
          { name: "Botella vino hervido", price: "18.00" },
          { name: "Casillero Merlot", price: "26.00" },
          { name: "Casillero Cabernet", price: "26.00" },
        ],
      },
      {
        id: "wiskies",
        title: "Botellas de Whisky",
        items: [
          { name: "Passport", price: "30.00" },
          { name: "Buchanan's Master", price: "80.00" },
          { name: "Johnnie Negro", price: "90.00" },
          { name: "Johnnie Dorado", price: "85.00" },
          { name: "Old Parr", price: "120.00" },
          { name: "Chivas", price: "75.00" },
          { name: "Buchanan's Deluxe", price: "—" },
        ],
      },
      {
        id: "descorches",
        title: "Descorches",
        items: [
          { name: "Whisky", price: "20.00" },
          { name: "Vinos", price: "7.00" },
        ],
        note: "Incluye vasos, agua mineral y hielo.",
      },
    ],
  },
];
