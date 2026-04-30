# Manual: Cómo editar el menú de Corte Piedra

Este documento explica cómo modificar el menú del sitio web sin tocar código. Todo se hace desde Google Sheets y Google Drive.

---

## ¿Cómo funciona?

El menú del sitio web se carga automáticamente desde tres pestañas en el mismo Google Sheet que usas para fidelización:

- **Menu_Categorias** — las grandes secciones (Entradas, Cortes, Bar, etc.)
- **Menu_Secciones** — las subsecciones dentro de cada categoría
- **Menu_Items** — los platos/bebidas individuales

**Tiempo en aparecer cambios en el sitio:** hasta 1 hora desde que guardas el cambio en Sheets. Si necesitas verlo de inmediato, abre el sitio en otra pestaña y recarga con `Ctrl+Shift+R` (o `Cmd+Shift+R` en Mac).

---

## Cambiar un precio

1. Abre el Spreadsheet de Corte Piedra
2. Ve a la pestaña **Menu_Items**
3. Busca el plato (puedes usar `Ctrl+F` para buscar por nombre)
4. Edita la celda en la columna `price`
5. Listo — guarda automáticamente

**Ejemplo:** cambiar Mojito clásico de `5.00` a `5.50` → solo edita esa celda.

> ⚠️ **No incluyas el símbolo `$`** — solo el número (ej: `12.50`, no `$12.50`).
> Para precios con jarra/vaso usa el formato `1.50 / 6.00`.

---

## Cambiar/agregar una foto a un plato

### Paso 1 — Subir la foto a Drive

1. Abre la carpeta **Menu Imagenes**: https://drive.google.com/drive/folders/19saZQf-I2yr4ml4jUTuPJrtTQsY6owkN
2. Arrastra la foto desde tu computadora o teléfono (o usa el botón "Nuevo → Subir archivo")
3. Espera a que termine de subirse

### Paso 2 — Hacer la foto pública

1. En Drive, click derecho sobre la foto → **Compartir**
2. En "Acceso general", cambia a **"Cualquier usuario que tenga el enlace"**
3. Click en **Copiar enlace**
4. Click en **Listo**

### Paso 3 — Pegar el enlace en Sheets

1. Ve a **Menu_Items**, busca el plato
2. Pega el enlace en la columna `image_url`
3. Listo — el sitio convierte el enlace automáticamente al formato correcto

> 📌 **Tip:** las fotos cuadradas o 16:10 se ven mejor. Tamaño recomendado: 800x500 px o más grande.

### Para quitar una foto

Borra el contenido de la celda `image_url`.

---

## Ocultar un plato (sin borrarlo)

1. Ve a **Menu_Items**
2. En la columna `active`, cambia `TRUE` por `FALSE`
3. El plato desaparece del sitio pero queda en el Sheet por si lo quieres restaurar después

> ✅ **Buena práctica:** nunca borres filas. Usa `active=FALSE` para ocultar. Así siempre puedes recuperar.

---

## Agregar un plato nuevo

1. Ve a **Menu_Items**
2. Copia la última fila (selecciona la fila completa, `Ctrl+C`)
3. Pega en una fila nueva debajo (`Ctrl+V`)
4. Modifica los campos:
   - **section_id** — debe coincidir con el ID de una sección existente. Lo puedes ver en la pestaña `Menu_Secciones`
   - **name** — nombre del plato
   - **price** — precio sin `$`
   - **description** — opcional, descripción larga
   - **badge** — opcional, etiqueta destacada (ej: `Signature`, `Premium`, `Nuevo`)
   - **image_url** — opcional, link de Drive a la foto
   - **order** — un número para el orden visual (10, 20, 30 o el siguiente disponible)
   - **active** — `TRUE`

---

## Cambiar el orden de los platos

En la columna `order`, los números menores aparecen primero.

**Ejemplo:** si quieres que "Tomahawk" sea el primero de la sección Res, edita su `order` a `1`.

> 💡 **Tip:** usa números con saltos (10, 20, 30) para poder insertar items entre ellos sin renumerar todo.

---

## Cambiar nombre o descripción de una sección

1. Ve a **Menu_Secciones**
2. Edita las columnas `title`, `subtitle`, o `note`

---

## Cambiar nombre de una categoría grande

1. Ve a **Menu_Categorias**
2. Edita las columnas `title` o `tagline`

---

## Iconos disponibles para categorías

Solo puedes usar uno de estos valores en la columna `icon`:

| Icon | ¿Cuándo usarlo? |
|---|---|
| `flame` | Entradas, parrilla, fuego |
| `beef` | Cortes de carne |
| `chef-hat` | Grill, cocina del chef |
| `pizza` | Pizza, hamburguesas, alitas |
| `fish` | Mariscos |
| `cup` | Bebidas |
| `wine` | Bar, cócteles, vinos |

---

## Ver los cambios YA (sin esperar 1 hora)

Si el dueño/admin necesita ver un cambio inmediatamente:

1. **Limpiar cache del servidor:** abrir Apps Script → función `invalidarCacheMenu` → Ejecutar
2. **Limpiar cache del navegador:** abrir el sitio → presionar `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac)

---

## Preguntas frecuentes

**¿Por qué no veo mi cambio en el sitio?**
Espera hasta 1 hora, o sigue los pasos de "Ver los cambios YA" arriba.

**¿Cuál es la diferencia entre el menú de la mañana y la tarde?**
- `tradicional` — se muestra de 8:00 a 16:00 (tigrillos, bolones, típicos)
- `regular` — se muestra de 16:00 a 22:00 (cortes, parrilla, bar)
- La columna `menu_kind` en `Menu_Categorias` indica a cuál pertenece cada categoría

**¿Y si rompo algo del Sheet?**
- El sitio tiene un menú de respaldo en código. Si los datos del Sheet están mal, el sitio sigue funcionando con la última versión publicada.
- Google Sheets tiene historial de cambios: `Archivo → Historial de versiones → Ver historial de versiones` para restaurar una versión anterior.

**¿Las fotos de Drive son privadas?**
Solo las que tú compartas con "Cualquier usuario con el enlace" se verán en el sitio. Las demás siguen privadas.

**¿Puedo editar desde el celular?**
Sí. La app de Google Sheets en iOS/Android funciona perfectamente. Para subir fotos, usa la app de Google Drive desde el celular.

---

---

# Eventos y Promos del Día

Además del menú, también puedes editar la sección **Eventos** del sitio (calendario con karaoke, DJ, gastronómico, etc.) y las **promos** que aparecen en el banner según el día de la semana.

## Hojas

- **`Eventos`** — eventos en vivo (música, karaoke, DJ, etc.) — recurrentes o de fecha específica
- **`Promos`** — promociones de comida/bebida por día de la semana

> **Importante:** ambas aparecen en el calendario del sitio:
> - Los **eventos** se muestran como círculos de color (Karaoke = rojo, DJ = amarillo, etc.)
> - Las **promos** se muestran como un cuadradito ámbar 🟧 al lado
>
> Por ejemplo, el Jueves tiene "Jueves gastronómico" (evento) Y "Jueves de Ribeyes" (promo) — el calendario muestra AMBOS indicadores en ese día.

---

## Eventos: dos tipos

### Tipo 1: Recurrente (todos los X de cada semana)

Ejemplo: "Viernes de Karaoke" todos los viernes.

| Columna | Valor |
|---|---|
| `tipo` | `recurrente` |
| `dia_semana` | `5` (0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb) |
| `fecha` | _vacío_ |
| `titulo` | `Viernes de Karaoke` |
| `subtitulo` | `Abre tus cuerdas vocales con un cóctel en mano` |
| `hora_inicio` | `20` |
| `hora_fin` | `24` |
| `icon` | `mic` (mic, music, chef-hat, flame) |
| `color` | `#c73838` (color hex) |
| `active` | `TRUE` |

### Tipo 2: Fecha específica (un evento puntual)

Ejemplo: concierto el 15 de mayo de 2026.

| Columna | Valor |
|---|---|
| `tipo` | `fecha` |
| `dia_semana` | _vacío_ |
| `fecha` | `2026-05-15` (formato `YYYY-MM-DD`) |
| `titulo` | `Concierto especial` |
| `subtitulo` | `Música en vivo con banda invitada` |
| `hora_inicio` | `21` |
| `hora_fin` | `2` |
| `icon` | `music` |
| `color` | `#c9a35a` |
| `active` | `TRUE` |

---

## Iconos disponibles para eventos

| Icon | Uso típico |
|---|---|
| `mic` | Karaoke, micrófono abierto |
| `music` | DJ, banda en vivo |
| `chef-hat` | Eventos gastronómicos del chef |
| `flame` | Promo destacada |

---

## Promos por día

Una fila por día. Se muestra como banner cuando estás en el menú regular ese día.

| Columna | Ejemplo combo | Ejemplo descuento |
|---|---|---|
| `dia_semana` | `1` (Lunes) | `0` (Domingo) |
| `titulo` | `Lunes de Grilles` | `Domingo de mariscos` |
| `descripcion` | `Lleva 2 platos de Grilles...` | `10% de descuento en todos los mariscos` |
| `tipo_oferta` | `combo` | `discount` |
| `cantidad` | `2` | _vacío_ |
| `precio_unidad` | `12.50` | _vacío_ |
| `descuento_pct` | _vacío_ | `10` |
| `subtitulo` | `en Grilles` | `en mariscos` |
| `imagen` | `/dishes/grill-hero.webp` | `/dishes/ceviche.webp` |
| `active` | `TRUE` | `TRUE` |

> **Día cerrado** (ej: Martes): pon `active=FALSE` o no incluyas la fila para ese día.

---

## Cambios visibles

- **5 minutos máximo** (cache cliente)
- **Inmediato** con `Cmd+Shift+R` en el navegador
- Si tienes el trigger automático instalado (`instalarTriggerMenu`), el cache servidor se limpia al editar el Sheet

---

---

# Galería de fotos (Cocina y Momentos compartidos)

Las dos secciones del sitio que muestran fotos también son editables desde una sola hoja: **`Galeria`**.

- **Sección "Nuestra cocina"** (Cocina) → fotos de platos firmados con descripción
- **Sección "Momentos compartidos"** (Galería) → fotos de clientes y ambiente

## Cómo agregar/editar una foto

### Paso 1: Subir a Drive
Igual que con el menú: subes la foto a la carpeta **Menu Imagenes** de Drive y la haces pública.

### Paso 2: Agregar fila en `Galeria`

| Columna | Valor cocina | Valor galería |
|---|---|---|
| `seccion` | `cocina` | `galeria` |
| `tipo` | `image` o `video` | `image` |
| `src` | URL de Drive (o YouTube ID si es video) | URL de Drive |
| `poster` | _vacío_ (URL preview si es video) | _vacío_ |
| `titulo` | "Al fuego vivo" | "Cenas con velas" |
| `descripcion` | "Cortes premium..." | _opcional_ |
| `order` | 1, 2, 3... | 1, 2, 3... |
| `active` | TRUE | TRUE |

### Para videos en Cocina
- `tipo`: `video`
- `src`: solo el ID de YouTube (la parte después de `?v=`, ejemplo: `dQw4w9WgXcQ`)
- `poster`: URL de Drive con la imagen de portada
- `descripcion`: opcional

## Quitar foto

Cambia `active` a `FALSE` (preferible) o borra la fila.

## Reordenar

Edita la columna `order`. Números menores aparecen primero.

---

## ¿Algo no funciona?

Contacta a soporte técnico (Bryan) con:
- Pestaña que estabas editando
- Captura de pantalla del error o del estado actual
- Qué intentabas hacer
