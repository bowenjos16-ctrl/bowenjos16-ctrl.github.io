/**
 * CORTE PIEDRA · Apps Script combinado
 * ────────────────────────────────────
 * Maneja DOS sistemas en un solo Google Sheet + Web App:
 *   1. Evaluaciones (ratings de 5 estrellas ya existente)
 *   2. Fidelización (loyalty con GPS + OTP diaria)
 *
 * Pasos de setup al final del archivo (README).
 */

// ═══════════════════════════════════════════════════════════
//  CONFIGURACIÓN POR DEFECTO
// ═══════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  restaurante_nombre: "Corte Piedra",
  restaurante_email_dueno: "bryanligabow@gmail.com, cortepiedra2024@gmail.com, jeanxo1234@gmail.com",
  restaurante_telefono: "+593 96 842 9494",
  puntos_por_visita: 50,
  cooldown_horas: 24,
  sesion_minutos: 60,
  max_intentos_password: 5,
  bloqueo_minutos: 60,
  nivel_bronce_min: 0,
  nivel_plata_min: 500,
  nivel_oro_min: 1500,
  restaurante_lat: -3.6833,     // CAMBIAR por coords reales de Piñas
  restaurante_lng: -79.6833,
  radio_metros: 50,
};

const SHEETS = {
  EVAL: "Evaluaciones",
  CLI: "Clientes",
  TRX: "Transacciones",
  CAN: "Canjes",
  PWD: "Passwords_Diarias",
  CFG: "Configuracion",
  FAIL: "Intentos_Fallidos",
};

// ═══════════════════════════════════════════════════════════
//  SETUP (ejecutar UNA vez)
// ═══════════════════════════════════════════════════════════

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureSheet_(ss, SHEETS.EVAL, ["fecha", "estrellas", "nombre", "comentario", "user_agent", "enviado"]);
  ensureSheet_(ss, SHEETS.CLI, [
    "id", "nombre", "telefono", "email", "fecha_registro",
    "puntos_actuales", "puntos_totales_historicos", "nivel",
    "acepto_terminos", "fecha_aceptacion", "ultima_acumulacion",
  ]);
  ensureSheet_(ss, SHEETS.TRX, [
    "id", "cliente_id", "telefono", "fecha_hora",
    "puntos_ganados", "password_usada", "ip_cliente",
  ]);
  ensureSheet_(ss, SHEETS.CAN, [
    "id", "cliente_id", "telefono", "fecha", "recompensa", "puntos_canjeados",
  ]);
  ensureSheet_(ss, SHEETS.PWD, ["fecha", "password_6_digitos", "fecha_envio_correo", "enviado_a"]);
  ensureSheet_(ss, SHEETS.FAIL, ["fecha_hora", "telefono", "password_intentada", "ip"]);

  // Configuracion (solo si está vacía)
  let cfg = ss.getSheetByName(SHEETS.CFG);
  if (!cfg) {
    cfg = ss.insertSheet(SHEETS.CFG);
    cfg.appendRow(["parametro", "valor", "descripcion"]);
    const DESC = {
      restaurante_nombre: "Nombre del restaurante",
      restaurante_email_dueno: "Email(s) del dueño — separa múltiples con coma",
      restaurante_telefono: "Teléfono del restaurante",
      puntos_por_visita: "Puntos acreditados por visita",
      cooldown_horas: "Horas entre acumulaciones del mismo cliente",
      sesion_minutos: "Duración de sesión cliente (minutos)",
      max_intentos_password: "Máx intentos password antes de bloquear",
      bloqueo_minutos: "Minutos de bloqueo tras fallos",
      nivel_bronce_min: "Puntos mínimos nivel Bronce",
      nivel_plata_min: "Puntos mínimos nivel Plata",
      nivel_oro_min: "Puntos mínimos nivel Oro",
      restaurante_lat: "Latitud GPS del restaurante",
      restaurante_lng: "Longitud GPS del restaurante",
      radio_metros: "Radio en metros para validar presencia",
    };
    Object.keys(DEFAULT_CONFIG).forEach((k) => {
      cfg.appendRow([k, DEFAULT_CONFIG[k], DESC[k] || ""]);
    });
    cfg.setFrozenRows(1);
    cfg.autoResizeColumns(1, 3);
  }

  SpreadsheetApp.getUi().alert(
    "✅ Setup completo. Ahora:\n" +
    "1. Edita la hoja 'Configuracion' con los valores reales\n" +
    "2. Ejecuta installTrigger() para programar la password diaria\n" +
    "3. Deploy → New deployment → Web app"
  );
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, headers.length);
  }
  return sh;
}

// ═══════════════════════════════════════════════════════════
//  TRIGGER DIARIO (password 6am)
// ═══════════════════════════════════════════════════════════

function installTrigger() {
  // Borrar triggers previos
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === "dailyPasswordJob")
    .forEach((t) => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger("dailyPasswordJob")
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .create();

  SpreadsheetApp.getUi().alert("⏰ Trigger diario instalado para las 6:00 AM");
}

function dailyPasswordJob() {
  const cfg = readConfig_();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.PWD);

  // Evitar duplicados si se dispara dos veces el mismo día
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === today || Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), "yyyy-MM-dd") === today) {
      return; // ya existe para hoy
    }
  }

  const pw = generate6DigitPassword_();
  const sentTo = String(cfg.restaurante_email_dueno || "").split(",").map(s => s.trim()).filter(Boolean);
  const now = new Date();

  sh.appendRow([today, pw, now, sentTo.join(", ")]);
  sendOwnerEmail_(cfg, pw, sentTo);
}

function testGeneratePassword() {
  dailyPasswordJob();
  SpreadsheetApp.getUi().alert("✅ Password generada. Revisa el correo.");
}

function generate6DigitPassword_() {
  for (let i = 0; i < 50; i++) {
    const n = Math.floor(100000 + Math.random() * 900000);
    const s = String(n);
    if (!isTrivial_(s)) return s;
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isTrivial_(s) {
  // todos iguales
  if (/^(\d)\1{5}$/.test(s)) return true;
  // secuencia ascendente/descendente
  const arr = s.split("").map(Number);
  let asc = true, desc = true;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== arr[i - 1] + 1) asc = false;
    if (arr[i] !== arr[i - 1] - 1) desc = false;
  }
  if (asc || desc) return true;
  // comunes
  const banned = ["000000", "123456", "654321", "111111", "123123", "112233"];
  return banned.indexOf(s) !== -1;
}

function sendOwnerEmail_(cfg, pw, recipients) {
  const name = cfg.restaurante_nombre || "Corte Piedra";
  const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MMM/yyyy");
  const subject = `🔐 Contraseña del día ${name} — ${fecha}`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:40px 20px;">
      <tr><td align="center">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;background:#000;border:1px solid rgba(200,32,46,0.3);border-radius:20px;overflow:hidden;">
          <tr><td style="padding:40px 30px 20px;text-align:center;">
            <p style="color:#c8202e;font-size:11px;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 6px;font-family:Arial,sans-serif;">Contraseña del día</p>
            <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;">${name}</h1>
            <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:8px 0 0;">${fecha}</p>
          </td></tr>
          <tr><td style="padding:20px 30px;">
            <div style="background:linear-gradient(135deg,rgba(200,32,46,0.15),rgba(139,22,33,0.1));border:1px solid rgba(200,32,46,0.4);border-radius:16px;padding:30px 20px;text-align:center;">
              <p style="color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 14px;font-family:Arial,sans-serif;">Código para meseros</p>
              <div style="font-family:'Courier New',monospace;font-size:48px;font-weight:700;color:#fff;letter-spacing:14px;padding:8px 0;">${pw}</div>
            </div>
          </td></tr>
          <tr><td style="padding:10px 30px 40px;">
            <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;margin:16px 0 0;font-family:Arial,sans-serif;">
              Comparte esta contraseña con tu equipo por WhatsApp o un pizarrón interno.
              Los meseros la teclearán en el celular del cliente al momento de acreditar puntos.
            </p>
            <p style="color:rgba(255,255,255,0.4);font-size:11px;line-height:1.5;margin:20px 0 0;font-family:Arial,sans-serif;">
              Mañana recibirás una nueva. La contraseña expira a las 23:59 de hoy.
            </p>
          </td></tr>
          <tr><td style="padding:20px 30px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:0;font-family:Arial,sans-serif;">Experiencia Gourmet en Cada Bocado</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`.trim();

  recipients.forEach((to) => {
    MailApp.sendEmail({ to, subject, htmlBody: html });
  });
}

// ═══════════════════════════════════════════════════════════
//  ROUTER (Web App entrypoint)
// ═══════════════════════════════════════════════════════════

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === "getConfig") return json_(getPublicConfig_());
  return ContentService.createTextOutput("Corte Piedra API").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || "{}";
    const data = JSON.parse(raw);
    const action = data.action || (e && e.parameter && e.parameter.action);

    // Sin action → legacy rating del sistema previo
    if (!action) return handleRating_(data);

    switch (action) {
      case "register":   return json_(register_(data));
      case "login":      return json_(login_(data));
      case "getClient":  return json_(getClient_(data));
      case "accumulate": return json_(accumulate_(data));
      case "getConfig":  return json_(getPublicConfig_());
      default:           return json_({ ok: false, error: "unknown action" });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════
//  LEGACY: ratings (sistema previo)
// ═══════════════════════════════════════════════════════════

function handleRating_(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEETS.EVAL);
    const cfg = readConfig_();

    sh.appendRow([
      new Date(data.timestamp || Date.now()),
      data.stars,
      data.name || "Anónimo",
      data.comment || "",
      (data.userAgent || "").substring(0, 100),
      "Sí",
    ]);

    const recipients = String(cfg.restaurante_email_dueno || "")
      .split(",").map(s => s.trim()).filter(Boolean);
    const stars = data.stars;
    const subject = `⭐ Nueva calificación: ${stars}/5 — ${cfg.restaurante_nombre}`;
    const body = `
Estrellas: ${"⭐".repeat(stars)}${"☆".repeat(5 - stars)} (${stars}/5)
Nombre: ${data.name || "Anónimo"}
Comentario: ${data.comment || "(sin comentario)"}
Fecha: ${new Date().toLocaleString("es-EC")}

${stars >= 4 ? "🎉 Calificación positiva — invitado a Google Reviews." :
  stars <= 2 ? "⚠️ BAJA. Contacta al cliente." : "👍 Neutra."}

— Bot Menú Corte Piedra
`.trim();
    recipients.forEach(to => MailApp.sendEmail(to, subject, body));

    return json_({ ok: true });
  } catch (e) {
    return json_({ ok: false, error: String(e) });
  }
}

// ═══════════════════════════════════════════════════════════
//  LOYALTY · endpoints
// ═══════════════════════════════════════════════════════════

function register_(data) {
  const phone = normalizePhone_(data.telefono);
  if (!data.nombre || !phone || !data.email) return { ok: false, error: "missing" };
  if (!data.acepto_terminos) return { ok: false, error: "terms" };

  const existing = findClientByPhone_(phone);
  if (existing) return { ok: true, client: existing, existed: true };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.CLI);
  const id = Utilities.getUuid();
  const now = new Date();
  sh.appendRow([
    id, data.nombre.trim(), phone, data.email.trim(), now,
    0, 0, "Bronce",
    true, now, ""
  ]);
  return { ok: true, client: findClientByPhone_(phone) };
}

function login_(data) {
  const phone = normalizePhone_(data.telefono);
  if (!phone) return { ok: false, error: "phone" };
  if (isPhoneBlocked_(phone)) return { ok: false, error: "blocked" };
  const c = findClientByPhone_(phone);
  if (!c) return { ok: false, error: "not_found" };
  return { ok: true, client: c };
}

function getClient_(data) {
  const phone = normalizePhone_(data.telefono);
  const c = findClientByPhone_(phone);
  if (!c) return { ok: false, error: "not_found" };
  return { ok: true, client: c };
}

function accumulate_(data) {
  const phone = normalizePhone_(data.telefono);
  const pw = String(data.password || "").trim();
  if (!phone || !pw) return { ok: false, error: "missing" };
  if (isPhoneBlocked_(phone)) return { ok: false, error: "blocked" };

  const cfg = readConfig_();
  const c = findClientByPhone_(phone);
  if (!c) return { ok: false, error: "not_found" };

  // cooldown
  if (c.ultima_acumulacion) {
    const last = new Date(c.ultima_acumulacion);
    const hoursDiff = (Date.now() - last.getTime()) / 36e5;
    if (hoursDiff < Number(cfg.cooldown_horas || 24)) {
      return { ok: false, error: "cooldown", hoursLeft: Math.ceil(Number(cfg.cooldown_horas) - hoursDiff) };
    }
  }

  const today = getTodayPassword_();
  if (pw !== today) {
    logFailed_(phone, pw, data.ip || "");
    return { ok: false, error: "wrong_password" };
  }

  const points = Number(cfg.puntos_por_visita || 50);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cli = ss.getSheetByName(SHEETS.CLI);
  const rows = cli.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (normalizePhone_(rows[i][2]) === phone) {
      const rowIdx = i + 1;
      const newCurrent = Number(rows[i][5] || 0) + points;
      const newTotal = Number(rows[i][6] || 0) + points;
      const nivel = computeLevel_(newTotal, cfg);
      cli.getRange(rowIdx, 6).setValue(newCurrent);
      cli.getRange(rowIdx, 7).setValue(newTotal);
      cli.getRange(rowIdx, 8).setValue(nivel);
      cli.getRange(rowIdx, 11).setValue(new Date());
      break;
    }
  }

  const trx = ss.getSheetByName(SHEETS.TRX);
  trx.appendRow([
    Utilities.getUuid(), c.id, phone, new Date(),
    points, pw, data.ip || "",
  ]);

  return { ok: true, pointsAwarded: points, client: findClientByPhone_(phone) };
}

function getPublicConfig_() {
  const cfg = readConfig_();
  return {
    ok: true,
    config: {
      restaurante_nombre: cfg.restaurante_nombre,
      restaurante_lat: Number(cfg.restaurante_lat),
      restaurante_lng: Number(cfg.restaurante_lng),
      radio_metros: Number(cfg.radio_metros || 50),
      puntos_por_visita: Number(cfg.puntos_por_visita || 50),
      cooldown_horas: Number(cfg.cooldown_horas || 24),
      sesion_minutos: Number(cfg.sesion_minutos || 60),
      nivel_bronce_min: Number(cfg.nivel_bronce_min || 0),
      nivel_plata_min: Number(cfg.nivel_plata_min || 500),
      nivel_oro_min: Number(cfg.nivel_oro_min || 1500),
    },
  };
}

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

function readConfig_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.CFG);
  if (!sh) return DEFAULT_CONFIG;
  const rows = sh.getDataRange().getValues();
  const out = Object.assign({}, DEFAULT_CONFIG);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) out[String(rows[i][0]).trim()] = rows[i][1];
  }
  return out;
}

function normalizePhone_(p) {
  return String(p || "").replace(/\D/g, "").replace(/^593/, "593");
}

function findClientByPhone_(phone) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.CLI);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (normalizePhone_(rows[i][2]) === phone) return clientRowToObj_(rows[i]);
  }
  return null;
}

function clientRowToObj_(r) {
  return {
    id: r[0], nombre: r[1], telefono: r[2], email: r[3],
    fecha_registro: r[4], puntos_actuales: Number(r[5] || 0),
    puntos_totales_historicos: Number(r[6] || 0), nivel: r[7],
    acepto_terminos: !!r[8], fecha_aceptacion: r[9],
    ultima_acumulacion: r[10],
  };
}

function getTodayPassword_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.PWD);
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const rows = sh.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    const d = rows[i][0];
    const dStr = d instanceof Date
      ? Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd")
      : String(d);
    if (dStr === today) return String(rows[i][1]);
  }
  // Fallback: generar on-demand
  dailyPasswordJob();
  const rows2 = sh.getDataRange().getValues();
  for (let i = rows2.length - 1; i >= 1; i--) {
    const d = rows2[i][0];
    const dStr = d instanceof Date
      ? Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd")
      : String(d);
    if (dStr === today) return String(rows2[i][1]);
  }
  return "";
}

function logFailed_(phone, pwTried, ip) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.FAIL);
  sh.appendRow([new Date(), phone, pwTried, ip || ""]);
}

function isPhoneBlocked_(phone) {
  const cfg = readConfig_();
  const max = Number(cfg.max_intentos_password || 5);
  const mins = Number(cfg.bloqueo_minutos || 60);
  const since = Date.now() - mins * 60 * 1000;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.FAIL);
  const rows = sh.getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    if (normalizePhone_(rows[i][1]) === phone) {
      const t = new Date(rows[i][0]).getTime();
      if (t >= since) count++;
    }
  }
  return count >= max;
}

function computeLevel_(totalPoints, cfg) {
  const oro = Number(cfg.nivel_oro_min || 1500);
  const plata = Number(cfg.nivel_plata_min || 500);
  if (totalPoints >= oro) return "Oro";
  if (totalPoints >= plata) return "Plata";
  return "Bronce";
}
