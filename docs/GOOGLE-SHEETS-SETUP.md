# 📊 Backend de Ratings con Google Sheets + Apps Script

Esta guía te deja el sistema de calificaciones conectado a una hoja de Google con emails automáticos al dueño. **Todo gratis, sin servidor.**

## Paso 1 · Crear la hoja de cálculo

1. Ve a <https://sheets.google.com> y crea una hoja en blanco
2. Ponle nombre: **"Corte Piedra · Calificaciones"**
3. En la fila 1, escribe estas cabeceras:

   | A | B | C | D | E | F |
   |---|---|---|---|---|---|
   | Fecha | Estrellas | Nombre | Comentario | Navegador | Enviado |

## Paso 2 · Pegar el Apps Script

1. En la hoja → menú **Extensiones → Apps Script**
2. Borra todo el código y pega esto:

```javascript
// ⚙️ CONFIGURACIÓN — cambia estos valores
const OWNER_EMAIL = "tu-correo@gmail.com";  // email del dueño
const RESTAURANT = "Corte Piedra";
const MIN_STARS_FOR_GOOGLE = 4;             // 4+ estrellas pide reseña pública

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Guardar fila
    sheet.appendRow([
      new Date(data.timestamp),
      data.stars,
      data.name,
      data.comment,
      (data.userAgent || "").substring(0, 100),
      "Sí",
    ]);

    // Enviar email al dueño
    const subject = `⭐ Nueva calificación: ${data.stars}/5 — ${RESTAURANT}`;
    const body = `
Hola! Acabas de recibir una nueva calificación en el menú digital:

Estrellas: ${"⭐".repeat(data.stars)}${"☆".repeat(5 - data.stars)}  (${data.stars}/5)
Nombre: ${data.name}
Comentario: ${data.comment || "(Sin comentario)"}
Fecha: ${new Date(data.timestamp).toLocaleString("es-EC")}

${
  data.stars >= MIN_STARS_FOR_GOOGLE
    ? "🎉 Calificación positiva — al cliente se le invitó a dejar reseña en Google Maps."
    : data.stars <= 2
      ? "⚠️ ATENCIÓN: calificación baja. Contacta al cliente si tienes forma."
      : "👍 Calificación neutra."
}

— Corte Piedra Menu Bot
    `.trim();

    MailApp.sendEmail(OWNER_EMAIL, subject, body);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("Corte Piedra rating endpoint");
}
```

3. Cambia `OWNER_EMAIL` por tu correo real
4. Guarda (Ctrl+S) con nombre: `Corte Piedra Ratings`

## Paso 3 · Desplegar como Web App

1. Arriba a la derecha: **Implementar → Nueva implementación**
2. Tipo: **Aplicación web**
3. Configuración:
   - Descripción: *Corte Piedra Ratings*
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
4. Click **Implementar**
5. Autoriza con tu cuenta de Google
6. **Copia la URL** que termina en `/exec` — se ve así:
   `https://script.google.com/macros/s/AKfycbz.../exec`

## Paso 4 · Pegar la URL en el menú

Abre `/lib/config.ts` y cambia:

```ts
ratingEndpoint: "",
```

por:

```ts
ratingEndpoint: "https://script.google.com/macros/s/TU_ID_AQUI/exec",
```

Guarda, recarga el sitio, y prueba calificar. Cada rating:
- Se guarda en tu Google Sheet ✅
- Te llega un email con los detalles ✅
- Si es ⭐⭐⭐⭐+ → el cliente ve un botón para dejar reseña en Google Maps ✅

## Paso 5 · (Opcional) Dashboard de estadísticas

En la misma Google Sheet, agrega una pestaña **"Dashboard"** con fórmulas:

```
Total calificaciones:     =COUNTA(Sheet1!B2:B)
Promedio:                 =AVERAGE(Sheet1!B2:B)
5 estrellas:              =COUNTIF(Sheet1!B2:B, 5)
4 estrellas:              =COUNTIF(Sheet1!B2:B, 4)
Positivas (≥4):           =COUNTIF(Sheet1!B2:B, ">=4")
```

Inserta un gráfico y tienes tu panel de análisis.

## Configurar Place ID de Google Maps

Para que el botón "Dejar reseña en Google" vaya directo a tu ficha:

1. Ve a <https://developers.google.com/maps/documentation/places/web-service/place-id>
2. Busca tu restaurante → copia el Place ID (tipo `ChIJN1t_tDeuEmsRUsoyG83frY4`)
3. En `/lib/config.ts` cambia:

```ts
googleReviewUrl: "https://search.google.com/local/writereview?placeid=TU_PLACE_ID",
```

Listo.
