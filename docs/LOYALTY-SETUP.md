# 🎯 Sistema de Fidelización · Setup

Guía para activar el sistema de puntos + GPS + OTP diaria en el menú Corte Piedra.

El sistema viene en **modo demo** por defecto (localStorage, cualquier OTP de 6 dígitos sirve). Para activarlo de verdad sigue estos pasos.

---

## 1. Crear Google Sheet

1. Ve a <https://sheets.google.com> y crea uno vacío
2. Ponle nombre: **Corte Piedra · Fidelización**
3. **Extensiones → Apps Script**
4. Borra el `function myFunction()` por defecto
5. Pega el contenido de `docs/apps-script-combined.gs`
6. Guarda (Ctrl+S) con nombre "Corte Piedra API"

## 2. Ejecutar `setup()`

1. En la barra de funciones selecciona `setup`
2. Click **Ejecutar** (necesita autorización la primera vez → clic en "Revisar permisos" → elige tu cuenta → "Ir a Corte Piedra API (no seguro)" → "Permitir")
3. Se crean 7 hojas: `Evaluaciones`, `Clientes`, `Transacciones`, `Canjes`, `Passwords_Diarias`, `Configuracion`, `Intentos_Fallidos`

## 3. Editar `Configuracion`

Abre la hoja `Configuracion` y edita estos valores:

| Parámetro | Valor ejemplo | Notas |
|-----------|--------------|-------|
| `restaurante_email_dueno` | `bryanligabow@gmail.com, otro@mail.com` | Separados por coma |
| `restaurante_lat` | `-3.6825` | Coordenada real del local (Google Maps → click derecho en el pin → copiar) |
| `restaurante_lng` | `-79.6822` | — |
| `radio_metros` | `50` | Distancia permitida |
| `puntos_por_visita` | `50` | Cambiable según estrategia |

## 4. Instalar trigger diario

1. En Apps Script selecciona la función `installTrigger`
2. Click **Ejecutar**
3. Verás "⏰ Trigger diario instalado para las 6:00 AM"

**Test inmediato**: ejecuta `testGeneratePassword` → debería llegarte el correo con la contraseña del día al email configurado.

## 5. Deploy como Web App

1. Arriba a la derecha: **Implementar → Nueva implementación**
2. **Tipo**: Aplicación web
3. Configuración:
   - Descripción: *Corte Piedra API*
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
4. Click **Implementar** → autoriza
5. **Copia la URL** (termina en `/exec`)

## 6. Pegar URL en el menú

Abre `/lib/config.ts` del proyecto y pega la URL:

```ts
ratingEndpoint: "https://script.google.com/macros/s/TU_ID/exec",
loyaltyApi:     "https://script.google.com/macros/s/TU_ID/exec",
```

**Es la misma URL** para ambos sistemas porque comparten Apps Script.

Guarda, haz commit + push → Vercel despliega solo → en 1 minuto está en vivo sin el banner "Modo demo".

## 7. Actualizar el Apps Script (importante)

Cada vez que edites el código del Apps Script:

1. **Implementar → Administrar implementaciones**
2. Click el ícono del lápiz ✏️
3. Cambia versión a **Nueva versión**
4. **Implementar**

Si no haces esto, los cambios no se publican al Web App.

---

## 📱 Flujo del cliente

1. Escanea QR en la mesa → abre el menú
2. Ve el **círculo arriba a la derecha** (ícono de persona)
3. Toca → aparece el modal
4. **Permiso de GPS** — si está en el local (≤50m) continúa; si no, bloqueado
5. **Login** (solo teléfono) o **Registro** (nombre + tel + email + términos)
6. Entra al **dashboard** estilo Apple Wallet con puntos y nivel
7. Toca **"Acumular puntos"**
8. Aparecen 6 inputs OTP
9. El mesero teclea la contraseña del día → se acreditan 50 pts
10. Animación `+50` dorada subiendo

## 🔒 Juegos bloqueados

Mientras el cliente NO está logueado, la sección **Juegos** muestra un candado con:

- 3 cards mini de cada juego bloqueado
- CTA "Iniciar sesión para jugar"
- Al hacer click abre el mismo modal de loyalty

Una vez logueado se desbloquean automáticamente los 3 juegos (Trivia, Memorama, Rasca y gana).

---

## 🏆 Niveles

| Nivel | Puntos acumulados | Color card |
|-------|-------------------|-----------|
| Bronce | 0 – 499 | Rojo vino |
| Plata | 500 – 1499 | Plateado |
| Oro | ≥ 1500 | Dorado |

Editable en `Configuracion`: `nivel_bronce_min`, `nivel_plata_min`, `nivel_oro_min`.

## 🛡️ Seguridad

- **Sesión**: 60 min en `localStorage`, después expira
- **Cooldown**: 24 h entre acumulaciones del mismo teléfono
- **Anti-fraude**: 5 intentos fallidos de contraseña → bloqueo 1 h del teléfono
- **Log completo**: hoja `Intentos_Fallidos` con fecha, teléfono, IP
- **Password del día**: generada al azar 6 dígitos, filtro anti-triviales (000000, 123456, etc.)

## 📊 Auditoría

Todas las hojas del Sheet son auditables en tiempo real:

- `Clientes` → lista completa con puntos actuales + nivel
- `Transacciones` → histórico de acumulaciones
- `Passwords_Diarias` → cuál se envió cada día
- `Intentos_Fallidos` → log anti-fraude

Puedes crear una hoja extra "Dashboard" con fórmulas:

```
Total clientes:      =COUNTA(Clientes!B2:B)
Visitas hoy:         =COUNTIFS(Transacciones!D:D, ">="&TODAY())
Top cliente:         =INDEX(Clientes!B:B, MATCH(MAX(Clientes!G:G), Clientes!G:G, 0))
Nivel Oro:           =COUNTIF(Clientes!H:H, "Oro")
```

---

## ⚙️ Arquitectura multi-restaurante

Cada restaurante cliente puede tener:
- Su propio Google Sheet
- Su propio Apps Script (container-bound)
- Su propio URL de Web App
- Su propio `lib/config.ts` con su URL

El código del Apps Script es idéntico para todos; solo cambian los valores en `Configuracion`.

---

## 🧪 Modo demo (actual)

Si `loyaltyApi` está vacío en `config.ts`:
- El modal muestra banner "MODO DEMO · SIN BACKEND"
- No pide GPS real (radio enorme)
- Datos guardados en `localStorage` del navegador
- Cualquier OTP de 6 dígitos válido
- Ideal para mostrar al dueño antes de activar

Para salir de demo: pega la URL real del Web App en `loyaltyApi`.
