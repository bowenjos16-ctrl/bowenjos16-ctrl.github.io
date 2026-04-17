# Corte Piedra · Menú Digital

Sitio web de menú digital para el restaurante **Corte Piedra** (Piñas, El Oro — Ecuador). Carta interactiva con integración WhatsApp, sistema de calificaciones a Google Sheets, minijuegos, eventos en vivo y más.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + TypeScript
- **Tailwind CSS 4**
- **Framer Motion** para animaciones
- **Lucide Icons**
- **Playfair Display** + **Inter** (Google Fonts)

## Funcionalidades

### Carta
- 7 categorías (Entradas, Cortes, Grill & Lomo Fino, Alitas/Burgers/Pizza, Mariscos, Bebidas, Bar)
- Navegación por tabs + sub-nav de categorías
- Badges: Más vendido, Signature, Ideal compartir, Premium, etc.
- Sugerencias de combos (upselling)
- Buscador con atajo `⌘K`

### Integración WhatsApp
- Botón "Pedir" en cada producto con mensaje pre-escrito
- Número configurable en `lib/config.ts`

### Conversión y marketing
- Splash de bienvenida con **Top 3 recomendados**
- **Promo del día** con countdown en vivo
- **Happy hour** automático por horario
- **Ruleta de descuentos** (8 premios, 1 tirada por sesión)
- Incentivo por seguir Instagram

### Zona de diversión
- Trivia Corte Piedra
- Memorama de platos
- Rasca y gana

### Experiencia
- Hero con video YouTube + fallback Ken Burns
- **Audio del menú** con Web Speech API
- **Mensaje del chef**
- **Eventos en vivo** con detección de día actual
- Galería con lightbox

### Calificaciones
- 5 estrellas + comentario
- POST a **Google Apps Script** (ver `docs/GOOGLE-SHEETS-SETUP.md`)
- Emails automáticos al dueño
- Redirige a Google Reviews si es ≥4 estrellas

## Configuración

Edita `lib/config.ts`:

```ts
export const CONFIG = {
  whatsapp: "593968429494",
  instagram: "cortepiedra",
  heroVideoId: "",        // YouTube ID para el hero
  ratingEndpoint: "",     // URL del Apps Script Web App
  // ...
};
```

Para el menú, edita `lib/menu-data.ts`.

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:3000
npm run build
npm run start
```

## Branding

- **Paleta**: negro puro (#000) + blanco (#fff) + rojo (#c8202e)
- **Isotipo**: la llama icónica del logo, animada con flicker
- **Tipografía**: Playfair Display (serif) + Inter (sans)
- **Tagline**: *"Experiencia Gourmet en Cada Bocado"*

## Backend de ratings

Sigue `docs/GOOGLE-SHEETS-SETUP.md` para conectar el sistema de calificaciones a una hoja de Google con emails automáticos.

---

Hecho para Corte Piedra · Parrilla & Mariscos · Piñas, El Oro, Ecuador.
