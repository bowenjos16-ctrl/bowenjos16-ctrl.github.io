/**
 * CORTE PIEDRA - Apps Script combinado
 * ------------------------------------
 * Maneja DOS sistemas en un solo Google Sheet + Web App:
 *   1. Evaluaciones (ratings de 5 estrellas)
 *   2. Fidelizacion (loyalty con GPS + OTP diaria)
 *
 * Pasos de setup al final del archivo.
 */

// =============================================================
//  CONFIGURACION POR DEFECTO
// =============================================================

var DEFAULT_CONFIG = {
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
  restaurante_lat: -3.6833,     // CAMBIAR por coords reales de Pinas
  restaurante_lng: -79.6833,
  radio_metros: 50
};

var SHEETS = {
  EVAL: "Evaluaciones",
  CLI: "Clientes",
  TRX: "Transacciones",
  CAN: "Canjes",
  PWD: "Passwords_Diarias",
  CFG: "Configuracion",
  FAIL: "Intentos_Fallidos",
  REW: "Recompensas",
  MENU_CAT: "Menu_Categorias",
  MENU_SEC: "Menu_Secciones",
  MENU_ITM: "Menu_Items",
  EVENTOS: "Eventos",
  PROMOS: "Promos",
  GALERIA: "Galeria"
};

// Recompensas por defecto - se crean en setup() si la hoja esta vacia
var DEFAULT_REWARDS = [
  { id: "BEB001", nombre: "Bebida grande gratis", descripcion: "Cualquier bebida grande del menu", costo_pts: 200, activo: true },
  { id: "POS001", nombre: "Postre del chef", descripcion: "Postre seleccionado del dia por el chef", costo_pts: 500, activo: true },
  { id: "DSC001", nombre: "20% off en tu cuenta", descripcion: "Descuento del 20% sobre el subtotal", costo_pts: 1000, activo: true },
  { id: "CEN001", nombre: "Cena para 2 cortesia", descripcion: "Menu degustacion para 2 personas", costo_pts: 2000, activo: true }
];

// =============================================================
//  SETUP (ejecutar UNA vez)
// =============================================================

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureSheet_(ss, SHEETS.EVAL, ["fecha", "estrellas", "nombre", "comentario", "user_agent", "enviado"]);
  ensureSheet_(ss, SHEETS.CLI, [
    "id", "nombre", "telefono", "email", "fecha_registro",
    "puntos_actuales", "puntos_totales_historicos", "nivel",
    "acepto_terminos", "fecha_aceptacion", "ultima_acumulacion",
    "cedula"
  ]);
  ensureSheet_(ss, SHEETS.TRX, [
    "id", "cliente_id", "telefono", "fecha_hora",
    "puntos_ganados", "password_usada", "ip_cliente"
  ]);
  ensureSheet_(ss, SHEETS.CAN, [
    "id", "cliente_id", "telefono", "fecha", "recompensa", "puntos_canjeados"
  ]);
  ensureSheet_(ss, SHEETS.PWD, ["fecha", "password_6_digitos", "fecha_envio_correo", "enviado_a"]);
  ensureSheet_(ss, SHEETS.FAIL, ["fecha_hora", "telefono", "password_intentada", "ip"]);

  // Recompensas - hoja con catalogo de premios canjeables
  var rewSheet = ensureSheet_(ss, SHEETS.REW, ["id", "nombre", "descripcion", "costo_pts", "activo"]);
  if (rewSheet.getLastRow() <= 1) {
    for (var r = 0; r < DEFAULT_REWARDS.length; r++) {
      var w = DEFAULT_REWARDS[r];
      rewSheet.appendRow([w.id, w.nombre, w.descripcion, w.costo_pts, w.activo]);
    }
  }

  var cfg = ss.getSheetByName(SHEETS.CFG);
  if (!cfg) {
    cfg = ss.insertSheet(SHEETS.CFG);
    cfg.appendRow(["parametro", "valor", "descripcion"]);
    var DESC = {
      restaurante_nombre: "Nombre del restaurante",
      restaurante_email_dueno: "Emails del dueno (separa multiples con coma)",
      restaurante_telefono: "Telefono del restaurante",
      puntos_por_visita: "Puntos acreditados por visita",
      cooldown_horas: "Horas entre acumulaciones del mismo cliente",
      sesion_minutos: "Duracion de sesion cliente en minutos",
      max_intentos_password: "Maximo intentos password antes de bloquear",
      bloqueo_minutos: "Minutos de bloqueo tras fallos",
      nivel_bronce_min: "Puntos minimos nivel Bronce",
      nivel_plata_min: "Puntos minimos nivel Plata",
      nivel_oro_min: "Puntos minimos nivel Oro",
      restaurante_lat: "Latitud GPS del restaurante",
      restaurante_lng: "Longitud GPS del restaurante",
      radio_metros: "Radio en metros para validar presencia"
    };
    var keys = Object.keys(DEFAULT_CONFIG);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      cfg.appendRow([k, DEFAULT_CONFIG[k], DESC[k] || ""]);
    }
    cfg.setFrozenRows(1);
    cfg.autoResizeColumns(1, 3);
  }

  SpreadsheetApp.getUi().alert(
    "Setup completo. Ahora:\n" +
    "1. Edita la hoja Configuracion con los valores reales\n" +
    "2. Ejecuta installTrigger() para programar la password diaria\n" +
    "3. Deploy -> Nueva implementacion -> Web app"
  );
}

function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, headers.length);
  }
  return sh;
}

// =============================================================
//  TRIGGER DIARIO (password 6am)
// =============================================================

function installTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "dailyPasswordJob") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger("dailyPasswordJob")
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .create();

  SpreadsheetApp.getUi().alert("Trigger diario instalado para las 6:00 AM");
}

function dailyPasswordJob() {
  var cfg = readConfig_();
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.PWD);

  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var dRaw = data[i][0];
    var dStr = dRaw instanceof Date
      ? Utilities.formatDate(dRaw, Session.getScriptTimeZone(), "yyyy-MM-dd")
      : String(dRaw);
    if (dStr === today) {
      return; // ya existe para hoy
    }
  }

  var pw = generate6DigitPassword_();
  var sentTo = String(cfg.restaurante_email_dueno || "")
    .split(",")
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return !!s; });
  var now = new Date();

  sh.appendRow([today, pw, now, sentTo.join(", ")]);
  sendOwnerEmail_(cfg, pw, sentTo);
}

function testGeneratePassword() {
  dailyPasswordJob();
  SpreadsheetApp.getUi().alert("Password generada. Revisa el correo.");
}

function generate6DigitPassword_() {
  for (var i = 0; i < 50; i++) {
    var n = Math.floor(100000 + Math.random() * 900000);
    var s = String(n);
    if (!isTrivial_(s)) return s;
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isTrivial_(s) {
  if (/^(\d)\1{5}$/.test(s)) return true;
  var arr = s.split("").map(Number);
  var asc = true, desc = true;
  for (var i = 1; i < arr.length; i++) {
    if (arr[i] !== arr[i - 1] + 1) asc = false;
    if (arr[i] !== arr[i - 1] - 1) desc = false;
  }
  if (asc || desc) return true;
  var banned = ["000000", "123456", "654321", "111111", "123123", "112233"];
  return banned.indexOf(s) !== -1;
}

function sendOwnerEmail_(cfg, pw, recipients) {
  var name = cfg.restaurante_nombre || "Corte Piedra";
  var fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MMM/yyyy");
  var subject = "Contrasena del dia " + name + " - " + fecha;

  var html =
    '<!DOCTYPE html>' +
    '<html><head><meta charset="UTF-8"></head>' +
    '<body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,serif;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:40px 20px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;background:#000;border:1px solid rgba(200,32,46,0.3);border-radius:20px;overflow:hidden;">' +
    '<tr><td style="padding:40px 30px 20px;text-align:center;">' +
    '<p style="color:#c8202e;font-size:11px;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 6px;font-family:Arial,sans-serif;">Contrasena del dia</p>' +
    '<h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;">' + name + '</h1>' +
    '<p style="color:rgba(255,255,255,0.5);font-size:13px;margin:8px 0 0;">' + fecha + '</p>' +
    '</td></tr>' +
    '<tr><td style="padding:20px 30px;">' +
    '<div style="background:linear-gradient(135deg,rgba(200,32,46,0.15),rgba(139,22,33,0.1));border:1px solid rgba(200,32,46,0.4);border-radius:16px;padding:30px 20px;text-align:center;">' +
    '<p style="color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 14px;font-family:Arial,sans-serif;">Codigo para meseros</p>' +
    '<div style="font-family:Courier New,monospace;font-size:48px;font-weight:700;color:#fff;letter-spacing:14px;padding:8px 0;">' + pw + '</div>' +
    '</div></td></tr>' +
    '<tr><td style="padding:10px 30px 40px;">' +
    '<p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;margin:16px 0 0;font-family:Arial,sans-serif;">Comparte esta contrasena con tu equipo por WhatsApp o un pizarron interno. Los meseros la tecleraan en el celular del cliente al momento de acreditar puntos.</p>' +
    '<p style="color:rgba(255,255,255,0.4);font-size:11px;line-height:1.5;margin:20px 0 0;font-family:Arial,sans-serif;">Manana recibiras una nueva. La contrasena expira a las 23:59 de hoy.</p>' +
    '</td></tr>' +
    '<tr><td style="padding:20px 30px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">' +
    '<p style="color:rgba(255,255,255,0.3);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:0;font-family:Arial,sans-serif;">Experiencia Gourmet en Cada Bocado</p>' +
    '</td></tr></table></td></tr></table></body></html>';

  for (var i = 0; i < recipients.length; i++) {
    MailApp.sendEmail({ to: recipients[i], subject: subject, htmlBody: html });
  }
}

// =============================================================
//  ROUTER (Web App entrypoint)
// =============================================================

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  if (action === "getConfig") return json_(getPublicConfig_());
  if (action === "getMenu") {
    var nocache = e.parameter.nocache === "1" || e.parameter.nocache === "true";
    return json_(getMenu_((e.parameter.kind || "regular"), { nocache: nocache }));
  }
  if (action === "getEvents") {
    var nocache2 = e.parameter.nocache === "1" || e.parameter.nocache === "true";
    return json_(getEvents_({ nocache: nocache2 }));
  }
  if (action === "getGallery") {
    var nocache3 = e.parameter.nocache === "1" || e.parameter.nocache === "true";
    return json_(getGallery_({ nocache: nocache3 }));
  }
  return ContentService
    .createTextOutput("Corte Piedra API")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var action = "(none)";
  try {
    var raw = (e && e.postData && e.postData.contents) || "{}";
    var data = JSON.parse(raw);
    action = data.action || (e && e.parameter && e.parameter.action) || "(rating)";

    if (!data.action) return handleRating_(data);

    switch (data.action) {
      case "register":   return json_(withLock_(function () { return register_(data); }));
      case "login":      return json_(login_(data));
      case "getClient":  return json_(getClient_(data));
      case "accumulate": return json_(withLock_(function () { return accumulate_(data); }));
      case "getConfig":  return json_(getPublicConfig_());
      case "getRewards": return json_(getRewards_());
      case "redeem":     return json_(withLock_(function () { return redeem_(data); }));
      case "getHistory": return json_(getHistory_(data));
      case "awardInstagramBonus": return json_(withLock_(function () { return awardInstagramBonus_(data); }));
      case "awardGoogleReviewBonus": return json_(withLock_(function () { return awardGoogleReviewBonus_(data); }));
      case "awardGamePoints": return json_(withLock_(function () { return awardGamePoints_(data); }));
      case "getMenu":    return json_(getMenu_(data.kind || "regular"));
      case "getEvents":  return json_(getEvents_({ nocache: data.nocache === true || data.nocache === 1 || data.nocache === "1" }));
      case "getGallery": return json_(getGallery_({ nocache: data.nocache === true || data.nocache === 1 || data.nocache === "1" }));
      default:           return json_({ ok: false, error: "unknown action" });
    }
  } catch (err) {
    console.log(JSON.stringify({ fn: "doPost", action: action, error: String(err) }));
    return json_({ ok: false, error: String(err) });
  }
}

/**
 * Ejecuta una operacion bajo LockService para evitar race conditions
 * cuando dos requests caen simultaneamente sobre el mismo recurso.
 * Guia seccion 8 - Evitar duplicados.
 */
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
  } catch (e) {
    return { ok: false, error: "busy", message: "Servidor ocupado, intenta de nuevo." };
  }
  try {
    return fn();
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * Verifica + registra una idempotencyKey reciente.
 * Si la key ya se uso en los ultimos 10 minutos, retorna true (duplicado).
 * Usa PropertiesService como cache de corto plazo.
 */
function isDuplicateRequest_(key) {
  if (!key) return false;
  var props = PropertiesService.getScriptProperties();
  var cacheKey = "idem:" + key;
  var existing = props.getProperty(cacheKey);
  if (existing) return true;
  // Almacena con timestamp; limpia entradas viejas oportunisticamente
  props.setProperty(cacheKey, String(Date.now()));
  cleanupIdempotencyKeys_(props);
  return false;
}

function cleanupIdempotencyKeys_(props) {
  // Limpieza ligera: borra entradas mayores a 10 min cuando se invoca
  try {
    var all = props.getProperties();
    var now = Date.now();
    var TTL = 10 * 60 * 1000;
    Object.keys(all).forEach(function (k) {
      if (k.indexOf("idem:") !== 0) return;
      var ts = Number(all[k]);
      if (!ts || now - ts > TTL) props.deleteProperty(k);
    });
  } catch (e) {}
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// =============================================================
//  LEGACY: ratings (sistema previo)
// =============================================================

function handleRating_(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEETS.EVAL);
    var cfg = readConfig_();

    sh.appendRow([
      new Date(data.timestamp || Date.now()),
      data.stars,
      data.name || "Anonimo",
      data.comment || "",
      (data.userAgent || "").substring(0, 100),
      "Si"
    ]);

    var recipients = String(cfg.restaurante_email_dueno || "")
      .split(",")
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return !!s; });
    var stars = Number(data.stars) || 0;
    var fechaStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    var classification =
      stars >= 4 ? { label: "Positiva", note: "Cliente invitado a publicar reseña en Google.", color: "#16a34a" }
      : stars <= 2 ? { label: "Crítica", note: "Sugerimos contactar al cliente para recuperar la experiencia.", color: "#dc2626" }
      : { label: "Neutra", note: "Sin acción requerida.", color: "#ca8a04" };
    var starsVisual = "";
    for (var k = 0; k < 5; k++) starsVisual += k < stars ? "★" : "☆";

    var subject = "[" + cfg.restaurante_nombre + "] Calificación " + stars + "/5 — " + classification.label;

    var nombre = (data.name || "Anónimo").toString();
    var comentario = (data.comment || "(sin comentario)").toString();

    // Plain-text fallback (clientes sin HTML)
    var bodyPlain =
      cfg.restaurante_nombre + " · Reporte de calificación\n" +
      "──────────────────────────────────────\n" +
      "Calificación:  " + starsVisual + "  (" + stars + "/5)\n" +
      "Clasificación: " + classification.label + "\n" +
      "Cliente:       " + nombre + "\n" +
      "Fecha:         " + fechaStr + "\n\n" +
      "Comentario:\n" + comentario + "\n\n" +
      classification.note + "\n\n" +
      "Este es un reporte automático generado por el sistema de gestión de " + cfg.restaurante_nombre + ".";

    var bodyHtml =
      '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;color:#1a1a1a;">' +
        '<div style="background:#0d0d0d;color:#ffffff;padding:24px 28px;border-radius:8px 8px 0 0;">' +
          '<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c8202e;font-weight:600;">' +
            (cfg.restaurante_nombre || "Restaurante") +
          '</div>' +
          '<div style="font-size:20px;font-weight:600;margin-top:6px;">Reporte de calificación</div>' +
          '<div style="font-size:13px;color:#a1a1a1;margin-top:4px;">' + fechaStr + '</div>' +
        '</div>' +
        '<div style="border:1px solid #e5e5e5;border-top:0;padding:28px;border-radius:0 0 8px 8px;">' +
          '<div style="font-size:13px;color:#666;letter-spacing:0.08em;text-transform:uppercase;">Calificación</div>' +
          '<div style="margin-top:6px;font-size:28px;color:#c8202e;letter-spacing:2px;">' + starsVisual + '</div>' +
          '<div style="font-size:14px;color:#666;margin-top:2px;">' + stars + ' de 5</div>' +
          '<div style="display:inline-block;margin-top:14px;padding:4px 12px;border-radius:999px;background:' + classification.color + ';color:#ffffff;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">' +
            classification.label +
          '</div>' +
          '<table style="width:100%;border-collapse:collapse;margin-top:24px;font-size:14px;">' +
            '<tr><td style="padding:8px 0;color:#666;width:110px;">Cliente</td><td style="padding:8px 0;color:#1a1a1a;font-weight:500;">' + escapeHtml_(nombre) + '</td></tr>' +
            '<tr><td style="padding:8px 0;color:#666;border-top:1px solid #f0f0f0;">Fecha</td><td style="padding:8px 0;color:#1a1a1a;border-top:1px solid #f0f0f0;">' + fechaStr + '</td></tr>' +
          '</table>' +
          '<div style="margin-top:20px;padding:16px;background:#f7f7f7;border-left:3px solid #c8202e;border-radius:4px;">' +
            '<div style="font-size:11px;color:#666;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Comentario</div>' +
            '<div style="margin-top:8px;font-size:14px;color:#1a1a1a;line-height:1.5;white-space:pre-wrap;">' + escapeHtml_(comentario) + '</div>' +
          '</div>' +
          '<div style="margin-top:20px;padding:14px 16px;background:' + classification.color + '14;border:1px solid ' + classification.color + '40;border-radius:6px;font-size:13px;color:#1a1a1a;">' +
            '<strong style="color:' + classification.color + ';">Acción sugerida:</strong> ' + classification.note +
          '</div>' +
          '<div style="margin-top:28px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:11px;color:#999;letter-spacing:0.04em;">' +
            'Reporte automático · Sistema de gestión ' + (cfg.restaurante_nombre || "") +
          '</div>' +
        '</div>' +
      '</div>';

    for (var i = 0; i < recipients.length; i++) {
      MailApp.sendEmail({
        to: recipients[i],
        subject: subject,
        body: bodyPlain,
        htmlBody: bodyHtml,
        name: cfg.restaurante_nombre || "Corte Piedra"
      });
    }

    return json_({ ok: true });
  } catch (e) {
    return json_({ ok: false, error: String(e) });
  }
}

/**
 * Normaliza cedula leida de Sheets: quita no-digitos y restaura el 0
 * inicial si quedo con 9 digitos (Sheets convierte numero y elimina el 0).
 */
function normalizeCedula_(v) {
  if (v === "" || v == null) return "";
  var digits = String(v).replace(/\D/g, "");
  if (digits.length === 9) digits = "0" + digits;
  return digits;
}

function escapeHtml_(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// =============================================================
//  LOYALTY endpoints
// =============================================================

function register_(data) {
  var phone = normalizePhone_(data.telefono);
  var cedula = String(data.cedula || "").replace(/\D/g, "");
  if (!data.nombre || !phone || !data.email) return { ok: false, error: "missing" };
  if (!cedula || cedula.length !== 10) return { ok: false, error: "cedula" };
  if (!data.acepto_terminos) return { ok: false, error: "terms" };

  var existing = findClientByPhone_(phone);
  if (existing) return { ok: true, client: existing, existed: true };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.CLI);
  var id = Utilities.getUuid();
  var now = new Date();
  sh.appendRow([
    id, String(data.nombre).trim(), phone, String(data.email).trim(), now,
    0, 0, "Bronce",
    true, now, "",
    ""
  ]);
  // Forzar formato texto en la celda de cedula para preservar ceros iniciales
  // (Google Sheets convierte "0123456789" a numero y elimina el 0).
  var lastRow = sh.getLastRow();
  sh.getRange(lastRow, 12).setNumberFormat("@").setValue(cedula);
  return { ok: true, client: findClientByPhone_(phone) };
}

/**
 * Aplica formato texto ("@") a toda la columna de cedulas (col L = 12) en
 * la hoja Clientes. Ejecuta una vez para que cedulas existentes y futuras
 * conserven sus ceros iniciales. Tambien repara filas donde el 0 ya se
 * perdio (asume cedulas de 10 digitos).
 */
function fixCedulasLeadingZeros() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.CLI);
  if (!sh) return;
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return;
  var range = sh.getRange(2, 12, lastRow - 1, 1);
  range.setNumberFormat("@");
  var values = range.getValues();
  for (var i = 0; i < values.length; i++) {
    var v = values[i][0];
    if (v === "" || v == null) continue;
    var digits = String(v).replace(/\D/g, "");
    // Si quedo con 9 digitos, falta el 0 inicial.
    if (digits.length === 9) digits = "0" + digits;
    values[i][0] = digits;
  }
  range.setValues(values);
}

function login_(data) {
  var phone = normalizePhone_(data.telefono);
  if (!phone) return { ok: false, error: "phone" };
  if (isPhoneBlocked_(phone)) return { ok: false, error: "blocked" };
  var c = findClientByPhone_(phone);
  if (!c) return { ok: false, error: "not_found" };
  return { ok: true, client: c };
}

function getClient_(data) {
  var phone = normalizePhone_(data.telefono);
  var c = findClientByPhone_(phone);
  if (!c) return { ok: false, error: "not_found" };
  return { ok: true, client: c };
}

function accumulate_(data) {
  var phone = normalizePhone_(data.telefono);
  var pw = String(data.password || "").trim();
  if (!phone || !pw) return { ok: false, error: "missing" };
  if (isPhoneBlocked_(phone)) return { ok: false, error: "blocked" };

  // Idempotency: si el cliente reintento, devolvemos estado actual sin sumar de nuevo
  if (isDuplicateRequest_(data.idempotencyKey)) {
    var existing = findClientByPhone_(phone);
    return { ok: true, duplicate: true, client: existing, pointsAwarded: 0 };
  }

  var cfg = readConfig_();
  var c = findClientByPhone_(phone);
  if (!c) return { ok: false, error: "not_found" };

  if (c.ultima_acumulacion) {
    var last = new Date(c.ultima_acumulacion);
    var hoursDiff = (Date.now() - last.getTime()) / 36e5;
    if (hoursDiff < Number(cfg.cooldown_horas || 24)) {
      return {
        ok: false,
        error: "cooldown",
        hoursLeft: Math.ceil(Number(cfg.cooldown_horas) - hoursDiff)
      };
    }
  }

  var today = getTodayPassword_();
  if (pw !== today) {
    logFailed_(phone, pw, data.ip || "");
    return { ok: false, error: "wrong_password" };
  }

  var points = Number(cfg.puntos_por_visita || 50);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cli = ss.getSheetByName(SHEETS.CLI);
  var rows = cli.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (normalizePhone_(rows[i][2]) === phone) {
      var rowIdx = i + 1;
      var newCurrent = Number(rows[i][5] || 0) + points;
      var newTotal = Number(rows[i][6] || 0) + points;
      var nivel = computeLevel_(newTotal, cfg);
      cli.getRange(rowIdx, 6).setValue(newCurrent);
      cli.getRange(rowIdx, 7).setValue(newTotal);
      cli.getRange(rowIdx, 8).setValue(nivel);
      cli.getRange(rowIdx, 11).setValue(new Date());
      break;
    }
  }

  var trx = ss.getSheetByName(SHEETS.TRX);
  trx.appendRow([
    Utilities.getUuid(), c.id, phone, new Date(),
    points, pw, data.ip || ""
  ]);

  return { ok: true, pointsAwarded: points, client: findClientByPhone_(phone) };
}

function getPublicConfig_() {
  var cfg = readConfig_();
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
      nivel_oro_min: Number(cfg.nivel_oro_min || 1500)
    }
  };
}

// =============================================================
//  HELPERS
// =============================================================

function readConfig_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.CFG);
  var out = {};
  var keys = Object.keys(DEFAULT_CONFIG);
  for (var k = 0; k < keys.length; k++) out[keys[k]] = DEFAULT_CONFIG[keys[k]];
  if (!sh) return out;
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0]) out[String(rows[i][0]).trim()] = rows[i][1];
  }
  return out;
}

function normalizePhone_(p) {
  return String(p || "").replace(/\D/g, "").replace(/^0/, "593");
}

function findClientByPhone_(phone) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.CLI);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (normalizePhone_(rows[i][2]) === phone) return clientRowToObj_(rows[i]);
  }
  return null;
}

function clientRowToObj_(r) {
  return {
    id: r[0],
    nombre: r[1],
    telefono: r[2],
    email: r[3],
    fecha_registro: r[4],
    puntos_actuales: Number(r[5] || 0),
    puntos_totales_historicos: Number(r[6] || 0),
    nivel: r[7],
    acepto_terminos: !!r[8],
    fecha_aceptacion: r[9],
    ultima_acumulacion: r[10],
    cedula: normalizeCedula_(r[11])
  };
}

function getTodayPassword_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.PWD);
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var rows = sh.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    var d = rows[i][0];
    var dStr = d instanceof Date
      ? Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd")
      : String(d);
    if (dStr === today) return String(rows[i][1]);
  }
  dailyPasswordJob();
  var rows2 = sh.getDataRange().getValues();
  for (var j = rows2.length - 1; j >= 1; j--) {
    var d2 = rows2[j][0];
    var dStr2 = d2 instanceof Date
      ? Utilities.formatDate(d2, Session.getScriptTimeZone(), "yyyy-MM-dd")
      : String(d2);
    if (dStr2 === today) return String(rows2[j][1]);
  }
  return "";
}

function logFailed_(phone, pwTried, ip) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.FAIL);
  sh.appendRow([new Date(), phone, pwTried, ip || ""]);
}

function isPhoneBlocked_(phone) {
  var cfg = readConfig_();
  var max = Number(cfg.max_intentos_password || 5);
  var mins = Number(cfg.bloqueo_minutos || 60);
  var since = Date.now() - mins * 60 * 1000;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.FAIL);
  var rows = sh.getDataRange().getValues();
  var count = 0;
  for (var i = 1; i < rows.length; i++) {
    if (normalizePhone_(rows[i][1]) === phone) {
      var t = new Date(rows[i][0]).getTime();
      if (t >= since) count++;
    }
  }
  return count >= max;
}

function computeLevel_(totalPoints, cfg) {
  var oro = Number(cfg.nivel_oro_min || 1500);
  var plata = Number(cfg.nivel_plata_min || 500);
  if (totalPoints >= oro) return "Oro";
  if (totalPoints >= plata) return "Plata";
  return "Bronce";
}

// =============================================================
//  REWARDS / CANJES / HISTORIAL endpoints
// =============================================================

/**
 * Lee el catalogo de recompensas activas desde la hoja Recompensas.
 * Devuelve solo las que tienen activo=true.
 */
function getRewards_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.REW);
  if (!sh) return { ok: true, rewards: [] };
  var rows = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    var activo = r[4];
    if (activo === false || activo === "FALSE" || activo === "false" || activo === 0) continue;
    out.push({
      id: String(r[0]),
      nombre: String(r[1]),
      descripcion: String(r[2]),
      costo_pts: Number(r[3] || 0)
    });
  }
  return { ok: true, rewards: out };
}

/**
 * Canjea una recompensa: valida puntos, descuenta del cliente,
 * registra en Canjes y devuelve un codigo unico de 6 caracteres.
 */
function redeem_(data) {
  var phone = normalizePhone_(data.telefono);
  var rewardId = String(data.rewardId || "").trim();
  if (!phone || !rewardId) return { ok: false, error: "missing" };

  // Idempotency: si reintenta, no descontar dos veces
  if (isDuplicateRequest_(data.idempotencyKey)) {
    return { ok: true, duplicate: true, message: "Canje ya procesado" };
  }

  var c = findClientByPhone_(phone);
  if (!c) return { ok: false, error: "not_found" };

  // Buscar la recompensa en el catalogo
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rewSh = ss.getSheetByName(SHEETS.REW);
  if (!rewSh) return { ok: false, error: "no_rewards" };
  var rewRows = rewSh.getDataRange().getValues();
  var reward = null;
  for (var i = 1; i < rewRows.length; i++) {
    if (String(rewRows[i][0]) === rewardId) {
      var activo = rewRows[i][4];
      if (activo === false || activo === "FALSE" || activo === "false" || activo === 0) {
        return { ok: false, error: "reward_inactive" };
      }
      reward = {
        id: String(rewRows[i][0]),
        nombre: String(rewRows[i][1]),
        costo_pts: Number(rewRows[i][3] || 0)
      };
      break;
    }
  }
  if (!reward) return { ok: false, error: "reward_not_found" };

  // Validar puntos
  if (Number(c.puntos_actuales) < reward.costo_pts) {
    return { ok: false, error: "insufficient_points", needed: reward.costo_pts, have: c.puntos_actuales };
  }

  // Descontar puntos del cliente (NO toca puntos_totales_historicos)
  var cli = ss.getSheetByName(SHEETS.CLI);
  var rows = cli.getDataRange().getValues();
  var newCurrent = 0;
  for (var j = 1; j < rows.length; j++) {
    if (normalizePhone_(rows[j][2]) === phone) {
      var rowIdx = j + 1;
      newCurrent = Number(rows[j][5] || 0) - reward.costo_pts;
      cli.getRange(rowIdx, 6).setValue(newCurrent);
      break;
    }
  }

  // Generar codigo unico de 6 caracteres alfanumericos (sin O/0/1/I para legibilidad)
  var code = generateRedeemCode_();

  // Registrar en hoja Canjes
  var canSh = ss.getSheetByName(SHEETS.CAN);
  canSh.appendRow([
    Utilities.getUuid(),
    c.id,
    phone,
    new Date(),
    reward.nombre + " (codigo: " + code + ")",
    reward.costo_pts
  ]);

  return {
    ok: true,
    code: code,
    reward: reward,
    newPoints: newCurrent,
    client: findClientByPhone_(phone)
  };
}

function generateRedeemCode_() {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0,1,I,O
  var code = "";
  for (var i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Devuelve las ultimas N transacciones (acumulaciones + canjes) del cliente.
 * Combina ambas hojas y ordena por fecha descendente.
 */
function getHistory_(data) {
  var phone = normalizePhone_(data.telefono);
  if (!phone) return { ok: false, error: "missing" };
  var limit = Number(data.limit || 20);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var items = [];

  // Acumulaciones
  var trxSh = ss.getSheetByName(SHEETS.TRX);
  if (trxSh) {
    var trxRows = trxSh.getDataRange().getValues();
    for (var i = 1; i < trxRows.length; i++) {
      if (normalizePhone_(trxRows[i][2]) === phone) {
        items.push({
          tipo: "acumulacion",
          fecha: trxRows[i][3],
          descripcion: "Visita al restaurante",
          puntos: Number(trxRows[i][4] || 0)
        });
      }
    }
  }

  // Canjes
  var canSh = ss.getSheetByName(SHEETS.CAN);
  if (canSh) {
    var canRows = canSh.getDataRange().getValues();
    for (var k = 1; k < canRows.length; k++) {
      if (normalizePhone_(canRows[k][2]) === phone) {
        items.push({
          tipo: "canje",
          fecha: canRows[k][3],
          descripcion: String(canRows[k][4] || ""),
          puntos: -Number(canRows[k][5] || 0)
        });
      }
    }
  }

  // Ordenar desc por fecha
  items.sort(function (a, b) {
    var da = new Date(a.fecha).getTime();
    var db = new Date(b.fecha).getTime();
    return db - da;
  });

  return { ok: true, history: items.slice(0, limit) };
}

/**
 * Otorga un bonus de 100 puntos por seguir en Instagram (una sola vez por usuario).
 * Verifica si ya lo ha reclamado consultando las transacciones con marker "INSTAGRAM".
 */
function awardInstagramBonus_(data) {
  var phone = normalizePhone_(data.telefono);
  if (!phone) return { ok: false, error: "missing" };

  // Idempotency: si reintenta, no duplicar bonus
  if (isDuplicateRequest_(data.idempotencyKey)) {
    return { ok: true, duplicate: true, message: "Bonus ya procesado" };
  }

  var c = findClientByPhone_(phone);
  if (!c) return { ok: false, error: "not_found" };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var trx = ss.getSheetByName(SHEETS.TRX);
  if (!trx) return { ok: false, error: "no_transactions_sheet" };

  // Verificar si ya reclamo el bonus Instagram
  var trxRows = trx.getDataRange().getValues();
  for (var i = 1; i < trxRows.length; i++) {
    if (normalizePhone_(trxRows[i][2]) === phone && String(trxRows[i][5] || "") === "INSTAGRAM") {
      return { ok: false, error: "already_claimed", alreadyClaimed: true };
    }
  }

  // Otorgar 100 puntos
  var pointsBonus = 100;
  var cli = ss.getSheetByName(SHEETS.CLI);
  var rows = cli.getDataRange().getValues();
  var cfg = readConfig_();
  for (var j = 1; j < rows.length; j++) {
    if (normalizePhone_(rows[j][2]) === phone) {
      var rowIdx = j + 1;
      var newCurrent = Number(rows[j][5] || 0) + pointsBonus;
      var newTotal = Number(rows[j][6] || 0) + pointsBonus;
      var nivel = computeLevel_(newTotal, cfg);
      cli.getRange(rowIdx, 6).setValue(newCurrent);
      cli.getRange(rowIdx, 7).setValue(newTotal);
      cli.getRange(rowIdx, 8).setValue(nivel);
      break;
    }
  }

  // Registrar en transacciones con marker INSTAGRAM
  trx.appendRow([
    Utilities.getUuid(), c.id, phone, new Date(),
    pointsBonus, "INSTAGRAM", ""
  ]);

  return {
    ok: true,
    pointsAwarded: pointsBonus,
    client: findClientByPhone_(phone)
  };
}

/**
 * Otorga 100 puntos por dejar resena en Google (una sola vez por usuario).
 * Marker en transacciones: GOOGLE_REVIEW.
 */
function awardGoogleReviewBonus_(data) {
  var phone = normalizePhone_(data.telefono);
  if (!phone) return { ok: false, error: "missing" };

  if (isDuplicateRequest_(data.idempotencyKey)) {
    return { ok: true, duplicate: true, message: "Bonus ya procesado" };
  }

  var c = findClientByPhone_(phone);
  if (!c) return { ok: false, error: "not_found" };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var trx = ss.getSheetByName(SHEETS.TRX);
  if (!trx) return { ok: false, error: "no_transactions_sheet" };

  var trxRows = trx.getDataRange().getValues();
  for (var i = 1; i < trxRows.length; i++) {
    if (normalizePhone_(trxRows[i][2]) === phone && String(trxRows[i][5] || "") === "GOOGLE_REVIEW") {
      return { ok: false, error: "already_claimed", alreadyClaimed: true };
    }
  }

  var pointsBonus = 100;
  var cli = ss.getSheetByName(SHEETS.CLI);
  var rows = cli.getDataRange().getValues();
  var cfg = readConfig_();
  for (var j = 1; j < rows.length; j++) {
    if (normalizePhone_(rows[j][2]) === phone) {
      var rowIdx = j + 1;
      var newCurrent = Number(rows[j][5] || 0) + pointsBonus;
      var newTotal = Number(rows[j][6] || 0) + pointsBonus;
      var nivel = computeLevel_(newTotal, cfg);
      cli.getRange(rowIdx, 6).setValue(newCurrent);
      cli.getRange(rowIdx, 7).setValue(newTotal);
      cli.getRange(rowIdx, 8).setValue(nivel);
      break;
    }
  }

  trx.appendRow([
    Utilities.getUuid(), c.id, phone, new Date(),
    pointsBonus, "GOOGLE_REVIEW", ""
  ]);

  return {
    ok: true,
    pointsAwarded: pointsBonus,
    client: findClientByPhone_(phone)
  };
}

/**
 * Otorga puntos ganados en juegos (Rasca y gana). Whitelist de codigos
 * autoriza solo SCRATCH50PTS=50 y SCRATCH100PTS=100. Marker en transacciones:
 * GAME:<prizeCode>. Limita: una vez cada cooldown_horas (alineado al lock
 * cliente del juego, pero validado tambien server-side).
 */
function awardGamePoints_(data) {
  var phone = normalizePhone_(data.telefono);
  var prizeCode = String(data.prizeCode || "").trim().toUpperCase();
  if (!phone) return { ok: false, error: "missing" };

  var GAME_PRIZES = {
    "SCRATCH50PTS": 50,
    "SCRATCH100PTS": 100
  };
  var pointsBonus = GAME_PRIZES[prizeCode];
  if (!pointsBonus) return { ok: false, error: "invalid_prize" };

  if (isDuplicateRequest_(data.idempotencyKey)) {
    return { ok: true, duplicate: true, message: "Premio ya procesado" };
  }

  var c = findClientByPhone_(phone);
  if (!c) return { ok: false, error: "not_found" };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var trx = ss.getSheetByName(SHEETS.TRX);
  if (!trx) return { ok: false, error: "no_transactions_sheet" };

  // Limite: 1 premio de juego cada cooldown_horas por usuario.
  var cfg = readConfig_();
  var cooldownMs = Number(cfg.cooldown_horas || 24) * 36e5;
  var trxRows = trx.getDataRange().getValues();
  var nowMs = Date.now();
  for (var i = 1; i < trxRows.length; i++) {
    if (normalizePhone_(trxRows[i][2]) !== phone) continue;
    var marker = String(trxRows[i][5] || "");
    if (marker.indexOf("GAME:") !== 0) continue;
    var when = trxRows[i][3];
    var whenMs = when instanceof Date ? when.getTime() : new Date(when).getTime();
    if (!isNaN(whenMs) && (nowMs - whenMs) < cooldownMs) {
      return { ok: false, error: "cooldown", hoursLeft: Math.ceil((cooldownMs - (nowMs - whenMs)) / 36e5) };
    }
  }

  var cli = ss.getSheetByName(SHEETS.CLI);
  var rows = cli.getDataRange().getValues();
  for (var j = 1; j < rows.length; j++) {
    if (normalizePhone_(rows[j][2]) === phone) {
      var rowIdx = j + 1;
      var newCurrent = Number(rows[j][5] || 0) + pointsBonus;
      var newTotal = Number(rows[j][6] || 0) + pointsBonus;
      var nivel = computeLevel_(newTotal, cfg);
      cli.getRange(rowIdx, 6).setValue(newCurrent);
      cli.getRange(rowIdx, 7).setValue(newTotal);
      cli.getRange(rowIdx, 8).setValue(nivel);
      break;
    }
  }

  trx.appendRow([
    Utilities.getUuid(), c.id, phone, new Date(),
    pointsBonus, "GAME:" + prizeCode, ""
  ]);

  return {
    ok: true,
    pointsAwarded: pointsBonus,
    prizeCode: prizeCode,
    client: findClientByPhone_(phone)
  };
}

// =============================================================
//  MENU EDITABLE (3 hojas: Categorias, Secciones, Items)
// =============================================================
//
// Endpoint:  GET ?action=getMenu&kind=regular|tradicional
// Retorna:   { ok, kind, data: MenuCategory[], generatedAt }
//
// Hojas:
//   Menu_Categorias: menu_kind | id | title | tagline | icon | note | order | active
//   Menu_Secciones:  category_id | id | title | subtitle | note | order | active
//   Menu_Items:      section_id | name | price | description | badge | image_url | order | active
//
// Cache server: 5 min (CacheService).  Cache cliente: 1 h (localStorage).

function getMenu_(menuKind, opts) {
  opts = opts || {};
  var cache = CacheService.getScriptCache();
  var cacheKey = "menu:" + menuKind;
  // Si nocache=1, bypassea el cache (útil para forzar lectura fresca)
  if (!opts.nocache) {
    try {
      var cached = cache.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cats = readSheet_(ss, SHEETS.MENU_CAT);
  var secs = readSheet_(ss, SHEETS.MENU_SEC);
  var itms = readSheet_(ss, SHEETS.MENU_ITM);

  var categories = cats
    .filter(function (c) { return String(c.menu_kind) === menuKind && truthy_(c.active); })
    .sort(function (a, b) { return Number(a.order || 0) - Number(b.order || 0); })
    .map(function (c) {
      var sections = secs
        .filter(function (s) { return String(s.category_id) === String(c.id) && truthy_(s.active); })
        .sort(function (a, b) { return Number(a.order || 0) - Number(b.order || 0); })
        .map(function (s) {
          var items = itms
            .filter(function (i) { return String(i.section_id) === String(s.id) && truthy_(i.active); })
            .sort(function (a, b) { return Number(a.order || 0) - Number(b.order || 0); })
            .map(function (i) {
              var out = { name: String(i.name || "") };
              var p = formatPrice_(i.price);
              if (p) out.price = p;
              if (i.description) out.description = String(i.description);
              if (i.badge) out.badge = String(i.badge);
              if (i.image_url) out.image = driveImageUrl_(String(i.image_url));
              return out;
            });
          var out = { id: String(s.id), title: String(s.title || ""), items: items };
          if (s.subtitle) out.subtitle = String(s.subtitle);
          if (s.note) out.note = String(s.note);
          return out;
        });
      var out = {
        id: String(c.id),
        title: String(c.title || ""),
        tagline: String(c.tagline || ""),
        icon: String(c.icon || "flame"),
        sections: sections
      };
      if (c.note) out.note = String(c.note);
      return out;
    });

  var result = {
    ok: true,
    kind: menuKind,
    data: categories,
    generatedAt: new Date().toISOString()
  };
  try { cache.put(cacheKey, JSON.stringify(result), 300); } catch (e) {}
  return result;
}

// Helper: lee una hoja como array de objetos usando primera fila como headers
function readSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) return [];
  var rows = sh.getDataRange().getValues();
  if (rows.length < 2) return [];
  var headers = rows[0].map(function (h) { return String(h).trim(); });
  return rows.slice(1)
    .filter(function (r) {
      return r.some(function (v) { return v !== "" && v !== null; });
    })
    .map(function (r) {
      var o = {};
      headers.forEach(function (h, i) { o[h] = r[i]; });
      return o;
    });
}

// Helper: formatea precio preservando 2 decimales y soportando "1.50 / 6.00"
function formatPrice_(v) {
  if (v === "" || v === null || v === undefined) return "";
  var s = String(v).trim();
  if (!s) return "";
  // Multi-precio (vaso/jarra) o cualquier formato no numérico: pasa tal cual
  if (s.indexOf("/") !== -1) return s;
  // Si es numérico, formatear con 2 decimales
  var n = Number(s.replace(",", "."));
  if (!isNaN(n) && isFinite(n)) return n.toFixed(2);
  return s;
}

// Helper: convierte cualquier valor a boolean (TRUE/FALSE, 1/0, etc.)
function truthy_(v) {
  if (v === true) return true;
  if (v === false) return false;
  if (v === "" || v === null || v === undefined) return true; // default: visible
  var s = String(v).toLowerCase().trim();
  if (s === "false" || s === "0" || s === "no") return false;
  return true;
}

// Helper: convierte cualquier URL de Drive al formato thumbnail (embed-friendly)
function driveImageUrl_(url) {
  if (!url) return "";
  var u = String(url).trim();
  // /file/d/{ID}/...
  var m = u.match(/\/file\/d\/([^\/?\s]+)/);
  if (m) return "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w800";
  // ?id={ID} o &id={ID}
  m = u.match(/[?&]id=([^&\s]+)/);
  if (m) return "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w800";
  // ID directo (25+ chars)
  if (/^[-\w]{25,}$/.test(u)) return "https://drive.google.com/thumbnail?id=" + u + "&sz=w800";
  // No es Drive: pasa tal cual (Cloudinary, etc.)
  return u;
}

// Helper: convierte cualquier URL de video (YouTube, Drive, vimeo, etc.)
// al formato embed listo para usar en un <iframe>.
// Retorna la URL embed; si no se puede deducir, devuelve la entrada tal cual.
function videoEmbedUrl_(src) {
  if (!src) return "";
  var u = String(src).trim();

  // Drive: /file/d/{ID}/(view|preview)
  var m = u.match(/drive\.google\.com\/file\/d\/([^\/?\s]+)/);
  if (m) return "https://drive.google.com/file/d/" + m[1] + "/preview";
  // Drive ?id=
  m = u.match(/drive\.google\.com.*[?&]id=([^&\s]+)/);
  if (m) return "https://drive.google.com/file/d/" + m[1] + "/preview";

  // YouTube: full URL watch?v= / youtu.be/ / shorts/
  m = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^&\?\s\/]+)/);
  if (m) return "https://www.youtube.com/embed/" + m[1] + "?autoplay=1";

  // Si ya es una URL embed (YouTube /embed/ o Drive /preview), pasala tal cual
  if (/youtube\.com\/embed\//.test(u) || /drive\.google\.com\/file\/d\/[^\/]+\/preview/.test(u)) {
    return u;
  }

  // ID puro de Drive (25+ chars). Asumimos Drive antes que YouTube
  // porque IDs de YouTube son cortos (11 chars).
  if (/^[-\w]{25,}$/.test(u)) return "https://drive.google.com/file/d/" + u + "/preview";

  // ID corto: asumimos YouTube
  if (/^[-\w]{6,15}$/.test(u)) return "https://www.youtube.com/embed/" + u + "?autoplay=1";

  // Fallback: devolvemos la cadena tal cual (puede ser un .mp4 directo, etc.)
  return u;
}

// Arregla la columna de precios en Menu_Items: la formatea como texto y
// reescribe los valores numéricos como "X.XX" (ej: 3 → "3.00", 3.5 → "3.50").
// Útil si Sheets convirtió automáticamente "3.00" a 3 al hacer migrarMenuActual().
function arreglarFormatoPrecios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.MENU_ITM);
  if (!sh) {
    SpreadsheetApp.getUi().alert("No existe la hoja Menu_Items. Corre migrarMenuActual primero.");
    return;
  }
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return;

  // Forzar columna C como texto
  sh.getRange("C:C").setNumberFormat("@");

  var range = sh.getRange(2, 3, lastRow - 1, 1);
  var values = range.getValues();
  var updated = values.map(function (row) {
    return [formatPrice_(row[0])];
  });
  range.setValues(updated);

  // Invalida cache para que el sitio recargue datos frescos
  try {
    var cache = CacheService.getScriptCache();
    cache.remove("menu:regular");
    cache.remove("menu:tradicional");
  } catch (e) {}

  try {
    SpreadsheetApp.getUi().alert(
      "Listo. " + updated.length + " precios formateados a 2 decimales.\n" +
      "Cache limpiada — el sitio mostrará los precios correctos en el próximo fetch."
    );
  } catch (e) {}
}

// Invalida cache manualmente (útil tras editar el Sheet y querer ver cambios ya)
function invalidarCacheMenu() {
  var cache = CacheService.getScriptCache();
  cache.remove("menu:regular");
  cache.remove("menu:tradicional");
  try {
    SpreadsheetApp.getUi().alert("Cache de menú limpiada. El próximo fetch leerá datos frescos del Sheet.");
  } catch (e) {}
}

/**
 * Trigger onEdit: limpia el cache automáticamente cuando se edita cualquier
 * hoja del menú. Esto hace que los cambios sean visibles inmediatamente sin
 * tener que ejecutar invalidarCacheMenu manualmente.
 *
 * Para activarlo: ejecutar instalarTriggerMenu() UNA vez.
 */
function onEditMenu_(e) {
  if (!e || !e.range) return;
  var sheetName = e.range.getSheet().getName();
  try {
    var cache = CacheService.getScriptCache();
    if (sheetName === SHEETS.MENU_CAT ||
        sheetName === SHEETS.MENU_SEC ||
        sheetName === SHEETS.MENU_ITM) {
      cache.remove("menu:regular");
      cache.remove("menu:tradicional");
    }
    if (sheetName === SHEETS.EVENTOS || sheetName === SHEETS.PROMOS) {
      cache.remove("events");
    }
    if (sheetName === SHEETS.GALERIA) {
      cache.remove("gallery");
    }
  } catch (err) {}
}

/**
 * Instala el trigger onEdit que auto-invalida cache al editar el menú.
 * Solo necesita correrse UNA vez.
 */
function instalarTriggerMenu() {
  // Borrar triggers existentes con el mismo handler
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "onEditMenu_") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("onEditMenu_")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();

  try {
    SpreadsheetApp.getUi().alert(
      "Trigger instalado.\n\n" +
      "Ahora cualquier edición en Menu_Categorias, Menu_Secciones o Menu_Items\n" +
      "limpiará automáticamente el cache del servidor.\n\n" +
      "Los cambios serán visibles en el sitio en ~5 minutos\n" +
      "(o inmediatamente al hacer Cmd+Shift+R)."
    );
  } catch (e) {}
}

// =============================================================
//  MIGRACION INICIAL (one-shot)
//  Ejecutar UNA vez desde el editor de Apps Script.
//  Pre-popula las 3 hojas con los datos actuales del menú.
// =============================================================

function migrarMenuActual() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var catSh = ensureSheet_(ss, SHEETS.MENU_CAT,
    ["menu_kind", "id", "title", "tagline", "icon", "note", "order", "active"]);
  var secSh = ensureSheet_(ss, SHEETS.MENU_SEC,
    ["category_id", "id", "title", "subtitle", "note", "order", "active"]);
  var itmSh = ensureSheet_(ss, SHEETS.MENU_ITM,
    ["section_id", "name", "price", "description", "badge", "image_url", "order", "active"]);

  // ⚠️ PROTECCIÓN: si las hojas ya tienen datos, pedir confirmación explícita
  // para evitar borrar ediciones manuales por accidente.
  var hasData = catSh.getLastRow() > 1 || secSh.getLastRow() > 1 || itmSh.getLastRow() > 1;
  if (hasData) {
    try {
      var ui = SpreadsheetApp.getUi();
      var resp = ui.alert(
        "⚠️ Hojas del menú ya contienen datos",
        "Si continúas, se BORRARÁN todos los precios, descripciones e imágenes que hayas editado manualmente y se reemplazarán con los valores hardcodeados originales.\n\n" +
        "¿Estás SEGURO que quieres reescribir todo desde cero?",
        ui.ButtonSet.YES_NO
      );
      if (resp !== ui.Button.YES) {
        ui.alert("Migración cancelada. Tus datos del Sheet quedan intactos.");
        return;
      }
    } catch (e) {
      // Si no hay UI disponible (ejecución sin dialog), abortar por seguridad
      throw new Error(
        "Las hojas ya tienen datos. Para evitar perder ediciones, esta función solo " +
        "puede correrse con confirmación visual. Ejecuta desde el editor de Apps Script."
      );
    }
  }

  // Forzar columna "price" (C) como texto plano para preservar "3.00" y "1.50 / 6.00"
  itmSh.getRange("C:C").setNumberFormat("@");

  // Limpia datos previos (preserva headers)
  if (catSh.getLastRow() > 1) catSh.getRange(2, 1, catSh.getLastRow() - 1, catSh.getLastColumn()).clearContent();
  if (secSh.getLastRow() > 1) secSh.getRange(2, 1, secSh.getLastRow() - 1, secSh.getLastColumn()).clearContent();
  if (itmSh.getLastRow() > 1) itmSh.getRange(2, 1, itmSh.getLastRow() - 1, itmSh.getLastColumn()).clearContent();

  var data = MENU_SEED_DATA_();

  data.forEach(function (cat, ci) {
    catSh.appendRow([
      cat.menu_kind, cat.id, cat.title, cat.tagline, cat.icon || "flame",
      cat.note || "", ci + 1, true
    ]);
    (cat.sections || []).forEach(function (sec, si) {
      secSh.appendRow([
        cat.id, sec.id, sec.title, sec.subtitle || "", sec.note || "", si + 1, true
      ]);
      (sec.items || []).forEach(function (it, ii) {
        itmSh.appendRow([
          sec.id, it.name, it.price || "", it.description || "", it.badge || "",
          it.image || "", ii + 1, true
        ]);
      });
    });
  });

  try {
    SpreadsheetApp.getUi().alert(
      "Migración completada.\n\n" +
      "Hojas creadas/actualizadas:\n" +
      "  • Menu_Categorias\n  • Menu_Secciones\n  • Menu_Items\n\n" +
      "Ahora:\n" +
      "1. Edita los items directamente en las hojas\n" +
      "2. Ejecuta invalidarCacheMenu() o espera 5 min\n" +
      "3. Recarga el sitio (Ctrl+Shift+R)"
    );
  } catch (e) {}
}

// Datos del menú actual (snapshot del PDF 2026, ambos menús)
function MENU_SEED_DATA_() {
  return [
    // ===== MENU REGULAR (tarde) =====
    {
      menu_kind: "regular", id: "entradas", title: "Entradas",
      tagline: "El comienzo perfecto", icon: "flame",
      sections: [
        {
          id: "entradas-individuales", title: "Entradas",
          items: [
            { name: "Madurito asado con queso y salprieta", price: "3.00" },
            { name: "Morcilla criolla a la parrilla", price: "3.50" },
            { name: "Chorizo Corte Piedra", price: "3.50" },
            { name: "Longaniza criolla a la parrilla", price: "5.00" },
            { name: "Empanaditas de viento", price: "3.00" }
          ]
        },
        {
          id: "entradas-compartir", title: "Para Compartir",
          items: [
            { name: "Tuétano con camarón y pan de ajo", price: "8.00", badge: "Signature" },
            { name: "Nachos con lomo fino de res", price: "9.00" },
            { name: "Nachos con pollo", price: "9.00" }
          ]
        }
      ]
    },
    {
      menu_kind: "regular", id: "cortes", title: "Cortes",
      tagline: "Res Brangus · Cerdo Yorkshire Canadiense", icon: "beef",
      note: "Incluyen: ensalada fresca, vegetales salteados y salsas. Puede seleccionar 2 opciones de guarnición.",
      sections: [
        {
          id: "cerdo", title: "Cerdo Yorkshire Canadiense",
          items: [
            { name: "Costilla ahumada", price: "18.00" },
            { name: "Baby ribs", price: "16.00" },
            { name: "Bondiola", price: "16.00" },
            { name: "Cow-boy", price: "16.00" },
            { name: "Matambre", price: "16.00" },
            { name: "Matambre pizza", price: "18.00" },
            { name: "Chistorra pizza", price: "16.00" }
          ]
        },
        {
          id: "res", title: "Res Brangus",
          items: [
            { name: "Porter house", price: "20.00" },
            { name: "Picaña", price: "18.00" },
            { name: "Rib-eye", price: "16.00" },
            { name: "Tomahawk", price: "20.00", badge: "Chef's Choice" },
            { name: "New York", price: "17.00" },
            { name: "Colita de cuadril", price: "18.00" },
            { name: "Biffe chorizo", price: "18.00" }
          ]
        }
      ]
    },
    {
      menu_kind: "regular", id: "grill", title: "Grill & Lomo Fino",
      tagline: "Clásicos a la parrilla", icon: "chef-hat",
      sections: [
        {
          id: "lomo-fino", title: "Lomo Fino de Res",
          items: [
            { name: "Lomo en salsa de chimichurri", price: "13.50" },
            { name: "Lomo en salsa de vino tinto", price: "15.00" },
            { name: "Lomo en salsa de tocino", price: "15.00" },
            { name: "Lomo en salsa de camarón", price: "16.00" },
            { name: "Filet mignon en salsa de champiñones", price: "15.00" }
          ]
        },
        {
          id: "grill-simple", title: "Grill",
          items: [
            { name: "Pollo", price: "7.50" },
            { name: "Panceta", price: "7.50" },
            { name: "Chuleta", price: "8.00" }
          ]
        },
        {
          id: "picaditas", title: "Picaditas",
          items: [
            { name: "Picadita Corte Piedra", price: "16.00",
              description: "Pollo, chuleta, panceta, chorizo, morcilla, longaniza, choclo en salsa de queso, madurito asado, ensalada fresca y salsas." },
            { name: "Picadita Corte Piedra Mixta", price: "24.00", badge: "Premium",
              description: "Pollo, chuleta, panceta, chorizo, morcilla, longaniza, choclo en salsa de queso, madurito asado, chicharrón de camarón, chicharrón de pescado, ensalada fresca y salsas." }
          ]
        }
      ]
    },
    {
      menu_kind: "regular", id: "alitas-burgers", title: "Alitas, Burgers & Pizza",
      tagline: "Street style elevado", icon: "pizza",
      sections: [
        {
          id: "alitas", title: "Alitas y Pop-Corn",
          note: "Salsas: Maracuyá · Búfalo · BBQ · Honey Mustard",
          items: [
            { name: "6 alitas", price: "6.00" },
            { name: "12 alitas", price: "11.00" },
            { name: "18 alitas", price: "16.00" },
            { name: "24 alitas", price: "20.00" },
            { name: "Pop-corn de pollo", price: "6.00" }
          ]
        },
        {
          id: "hamburguesas", title: "Hamburguesas",
          items: [
            { name: "Hamburguesa Americana", price: "6.00",
              description: "150 gr de lomo fino, pan de papa, queso cheddar, tocino, cebolla caramelizada, vegetales, papas crujientes y salsas." },
            { name: "Hamburguesa Corte Piedra", price: "9.00", badge: "Signature",
              description: "300 gr de lomo fino, pan de papa, queso cheddar y mozzarella, tocino, chorizo, vegetales, cebolla caramelizada, papas crujientes y salsas." }
          ]
        },
        {
          id: "pizza", title: "Pizza Artesanal",
          items: [
            { name: "Pizza de embutidos", price: "8.00",
              description: "Masa artesanal, salsa especial con cebolla caramelizada, mozzarella, parmesano, jamón, peperoni y albahaca." },
            { name: "Pizza con bolognesa", price: "10.00",
              description: "Masa artesanal, salsa especial con cebolla caramelizada, mozzarella, parmesano, bolognesa, peperoni y albahaca." }
          ]
        }
      ]
    },
    {
      menu_kind: "regular", id: "mariscos", title: "Mariscos",
      tagline: "Del mar a la mesa", icon: "fish",
      sections: [
        {
          id: "ceviches", title: "Ceviches",
          items: [
            { name: "Ceviche peruano", price: "7.50" },
            { name: "Ceviche de camarón", price: "8.50" },
            { name: "Ceviche mixto", price: "10.00" }
          ]
        },
        {
          id: "chicharrones", title: "Chicharrones",
          items: [
            { name: "Chicharrón mixto", price: "12.00" },
            { name: "Chicharrón de camarón", price: "10.00" },
            { name: "Chicharrón de pescado", price: "8.00" }
          ]
        },
        {
          id: "arroces", title: "Arroces",
          items: [
            { name: "Arroz con camarón", price: "9.00" },
            { name: "Arroz marinero", price: "12.00" }
          ]
        },
        {
          id: "mariscos-especiales", title: "Especiales",
          items: [
            { name: "Corvina en salsa de camarón", price: "13.50",
              description: "Acompañado de papitas chauchas salteadas, vegetales salteados, ensalada fresca y arroz (opcional)." },
            { name: "Salmón en salsa de naranja", price: "15.00",
              description: "Acompañado de papitas chauchas salteadas, vegetales salteados, ensalada fresca y arroz (opcional)." },
            { name: "Carrusel de mariscos", price: "24.00", badge: "Para compartir",
              description: "Ceviche peruano, arroz marinero, chicharrón de pescado, chicharrón de camarón, patacones y salsas." }
          ]
        }
      ]
    },
    {
      menu_kind: "regular", id: "bebidas", title: "Bebidas",
      tagline: "Refrescantes y caseras", icon: "cup",
      sections: [
        {
          id: "calientes", title: "Calientes",
          items: [
            { name: "Café filtrado", price: "1.00" },
            { name: "Capuchino", price: "3.00" },
            { name: "Chocolate natural", price: "2.00" },
            { name: "Chocolate suizo", price: "3.00" },
            { name: "Horchata", price: "1.00" },
            { name: "Menta", price: "1.00" },
            { name: "Manzanilla", price: "1.00" },
            { name: "Cedrón", price: "1.00" },
            { name: "Hierba luisa", price: "1.00" },
            { name: "Manzana y canela", price: "1.00" }
          ]
        },
        {
          id: "jugos", title: "Jugos",
          note: "Precios: vaso / jarra",
          items: [
            { name: "Maracuyá", price: "1.50 / 6.00" },
            { name: "Chicha morada", price: "2.50 / 7.50" },
            { name: "Piña", price: "1.50 / 6.00" },
            { name: "Piña coco", price: "2.50 / 7.50" },
            { name: "Mora", price: "1.50 / 6.00" },
            { name: "Frutos rojos", price: "2.50 / 7.50" }
          ]
        },
        {
          id: "limonadas", title: "Limonadas",
          items: [
            { name: "Tradicional", price: "1.50" },
            { name: "Imperial", price: "2.00" },
            { name: "Coco", price: "2.50" },
            { name: "Hierbabuena", price: "2.50" },
            { name: "Rosa", price: "2.50" },
            { name: "Frozen", price: "2.00" },
            { name: "Sandía", price: "2.00" },
            { name: "Frutos rojos", price: "2.00" }
          ]
        },
        {
          id: "gaseosas", title: "Gaseosas & Aguas",
          items: [
            { name: "Coca 300 ml", price: "1.00" },
            { name: "Sprite 300 ml", price: "1.00" },
            { name: "Fanta 300 ml", price: "1.00" },
            { name: "Fiora 300 ml", price: "1.00" },
            { name: "Gaseosa 1 lt", price: "2.00" },
            { name: "Gaseosa 3 lt", price: "4.00" },
            { name: "Fuze Tea 500 ml", price: "1.00" },
            { name: "Fuze Tea 1 lt", price: "2.00" },
            { name: "Agua mineral", price: "1.00" },
            { name: "Agua", price: "1.00" }
          ]
        },
        {
          id: "milkshakes", title: "Milkshakes",
          items: [
            { name: "Oreo", price: "4.50" },
            { name: "Nutella", price: "4.50" },
            { name: "Vainilla", price: "4.50" },
            { name: "Fresa", price: "4.50" },
            { name: "Café", price: "4.50" },
            { name: "Menta", price: "4.50" }
          ]
        }
      ]
    },
    {
      menu_kind: "regular", id: "bar", title: "Bar",
      tagline: "Cócteles, vinos y cervezas", icon: "wine",
      sections: [
        {
          id: "cocteles", title: "Cócteles",
          items: [
            { name: "Mojito clásico", price: "5.00" },
            { name: "Mojito frutos rojos", price: "6.00" },
            { name: "Mojito maracuyá", price: "5.00" },
            { name: "Margarita", price: "5.00" },
            { name: "Blue margarita", price: "5.00" },
            { name: "Passion fruit margarita", price: "6.00" },
            { name: "Martini", price: "5.00" },
            { name: "Padrino", price: "6.00" },
            { name: "Tequila sunrise", price: "5.00" },
            { name: "Laguna Azul", price: "4.50" },
            { name: "Paloma", price: "5.00" },
            { name: "Paloma sandía", price: "6.00" },
            { name: "Mai tai", price: "6.00" },
            { name: "Caipirinha", price: "4.00" },
            { name: "Piña colada", price: "6.00" },
            { name: "Saltamontes", price: "5.00" },
            { name: "Pantera rosa", price: "5.00" },
            { name: "Destornillador", price: "5.00" },
            { name: "Negroni", price: "7.00" },
            { name: "Orgasmo", price: "6.00" },
            { name: "Moscu mule", price: "7.00" },
            { name: "Gin tonic", price: "5.00" },
            { name: "Gin tonic frutos rojos", price: "6.00" },
            { name: "Gin bassil", price: "6.00" },
            { name: "Caipiroska", price: "5.00" },
            { name: "Caipiroska de piña", price: "6.00" }
          ]
        },
        {
          id: "cocteles-autor", title: "Cócteles de Autor",
          items: [
            { name: "¡Bien bestia!", price: "5.00" },
            { name: "Corte Piedra", price: "7.50", badge: "Signature" },
            { name: "Piladora", price: "6.00" },
            { name: "Coco loco Piñas style", price: "7.00" },
            { name: "¡Chuchaqui!", price: "6.00" }
          ]
        },
        {
          id: "cervezas", title: "Cerveza & Micheladas",
          items: [
            { name: "Club Platino", price: "2.00" },
            { name: "Corona", price: "2.50" },
            { name: "Heineken", price: "2.50" },
            { name: "Modelo", price: "3.50" },
            { name: "Michelada", price: "2.00" },
            { name: "Michelada de maracuyá", price: "2.50" },
            { name: "Chelada", price: "2.00" },
            { name: "Chelada de maracuyá", price: "2.50" }
          ]
        },
        {
          id: "vinos", title: "Vinos",
          items: [
            { name: "Catador", price: "4.00" },
            { name: "Copa Casillero Cabernet", price: "6.50" },
            { name: "Copa Casillero Merlot", price: "6.50" },
            { name: "Copa de sangría", price: "4.50" },
            { name: "Copa vino hervido", price: "4.50" },
            { name: "Jarra de sangría", price: "16.00" },
            { name: "Botella vino hervido", price: "18.00" },
            { name: "Casillero Merlot", price: "26.00" },
            { name: "Casillero Cabernet", price: "26.00" }
          ]
        }
      ]
    },

    // ===== MENU TRADICIONAL (mañana) =====
    {
      menu_kind: "tradicional", id: "entradas-trad-cat", title: "Entradas",
      tagline: "Para abrir el apetito", icon: "flame",
      sections: [
        {
          id: "entradas-trad", title: "Entradas",
          items: [
            { name: "Morcilla criolla a la parrilla", price: "3.50" },
            { name: "Chorizo Corte Piedra", price: "3.50" },
            { name: "Longaniza criolla a la parrilla", price: "5.00" },
            { name: "Empanaditas de viento", price: "3.00" },
            { name: "Madurito asado con queso y salprieta", price: "3.00" }
          ]
        }
      ]
    },
    {
      menu_kind: "tradicional", id: "tigrillos", title: "Tigrillos, Bolones & Molloco",
      tagline: "Sabores auténticos de nuestra tierra Piñas", icon: "flame",
      sections: [
        {
          id: "tigrillos-bolones", title: "Tigrillos · Bolones · Molloco",
          note: "Elige entre plátano verde o pintón.",
          items: [
            { name: "Tigrillo", price: "3.50", badge: "Típico" },
            { name: "Tigrillo mixto", price: "5.50", badge: "Más pedido", description: "Tigrillo con varios acompañantes." },
            { name: "Bolón con queso", price: "3.00" },
            { name: "Bolón con chicharrón", price: "4.00" },
            { name: "Bolón mixto", price: "4.00" },
            { name: "Molloco", price: "3.00" }
          ]
        },
        {
          id: "acompanantes", title: "Acompañantes",
          note: "Añade lo que quieras a tu tigrillo, bolón o molloco.",
          items: [
            { name: "Carne seca con huevo", price: "3.00" },
            { name: "Longaniza", price: "3.50" },
            { name: "Morcilla", price: "3.00" },
            { name: "Pollo al grill", price: "3.00" },
            { name: "Panceta al grill", price: "3.00" },
            { name: "Queso", price: "1.00" },
            { name: "Huevo", price: "1.00" }
          ]
        }
      ]
    },
    {
      menu_kind: "tradicional", id: "tradicionales", title: "Tradicionales",
      tagline: "Del fuego directo a tu mesa", icon: "beef",
      sections: [
        {
          id: "tradicionales-main", title: "Tradicionales",
          items: [
            { name: "Lomo fino al grill", price: "7.00", description: "Lomo fino en parrilla con acompañantes." },
            { name: "Picaña al grill", price: "8.00", badge: "Recomendado", description: "Corte de picaña a la parrilla." },
            { name: "Bistec de lomo fino", price: "8.50", description: "Bistec jugoso al grill." }
          ]
        },
        {
          id: "especiales-trad", title: "Especiales",
          note: "Todos con salsa de camarón casera.",
          items: [
            { name: "Bistec de camarón (clásico)", price: "7.50", badge: "Signature", description: "Bistec de lomo fino en salsa de camarón." },
            { name: "Bistec de camarón (deluxe)", price: "7.50", description: "Con salsa de camarón reducida y papas chauchas." },
            { name: "Bistec de camarón (express)", price: "7.00", description: "Porción clásica en salsa de camarón." }
          ]
        }
      ]
    },
    {
      menu_kind: "tradicional", id: "mariscos-trad-cat", title: "Mariscos",
      tagline: "Del mar a la mesa", icon: "fish",
      sections: [
        {
          id: "ceviches-trad", title: "Ceviches",
          items: [
            { name: "Ceviche peruano", price: "7.50" },
            { name: "Ceviche de camarón", price: "8.50" },
            { name: "Ceviche mixto", price: "10.00" }
          ]
        },
        {
          id: "chicharrones-trad", title: "Chicharrones",
          items: [
            { name: "Chicharrón mixto", price: "12.00" },
            { name: "Chicharrón de camarón", price: "10.00" },
            { name: "Chicharrón de pescado", price: "8.00" }
          ]
        },
        {
          id: "arroces-trad", title: "Arroces",
          items: [
            { name: "Arroz con camarón", price: "9.00" },
            { name: "Arroz marinero", price: "12.00" }
          ]
        }
      ]
    },
    {
      menu_kind: "tradicional", id: "alitas-trad", title: "Alitas & Pop-Corn",
      tagline: "Para picar mientras esperas", icon: "pizza",
      sections: [
        {
          id: "alitas-trad-s", title: "Alitas y Pop-Corn",
          note: "Salsas: Maracuyá · Búfalo · BBQ · Honey Mustard",
          items: [
            { name: "6 alitas", price: "6.00" },
            { name: "12 alitas", price: "11.00" },
            { name: "18 alitas", price: "16.00" },
            { name: "24 alitas", price: "20.00" },
            { name: "Pop-corn de pollo", price: "6.00" }
          ]
        }
      ]
    },
    {
      menu_kind: "tradicional", id: "bebidas-trad", title: "Bebidas",
      tagline: "Frescas y caseras", icon: "cup",
      sections: [
        {
          id: "calientes-trad", title: "Calientes",
          items: [
            { name: "Café filtrado", price: "1.00" },
            { name: "Chocolate natural", price: "2.00" },
            { name: "Chocolate suizo", price: "3.00" },
            { name: "Horchata", price: "1.00" },
            { name: "Menta", price: "1.00" },
            { name: "Manzanilla", price: "1.00" },
            { name: "Cedrón", price: "1.00" },
            { name: "Hierba luisa", price: "1.00" },
            { name: "Manzana y canela", price: "1.00" }
          ]
        },
        {
          id: "jugos-trad", title: "Jugos",
          note: "Precios: vaso / jarra",
          items: [
            { name: "Maracuyá", price: "1.50 / 2.50" },
            { name: "Chicha morada", price: "1.50 / 2.50" },
            { name: "Piña", price: "1.50 / 2.50" },
            { name: "Piña coco", price: "2.00" },
            { name: "Mora", price: "1.50 / 2.50" },
            { name: "Maracumora", price: "2.00" }
          ]
        },
        {
          id: "limonadas-trad", title: "Limonadas",
          items: [
            { name: "Tradicional", price: "1.50" },
            { name: "Imperial", price: "2.00" },
            { name: "Coco", price: "2.50" },
            { name: "Hierbabuena", price: "2.50" },
            { name: "Rosa", price: "2.50" },
            { name: "Frozen", price: "2.00" }
          ]
        },
        {
          id: "batidos-trad", title: "Batidos",
          items: [
            { name: "Piña", price: "2.00" },
            { name: "Fresa", price: "2.00" },
            { name: "Melón", price: "2.00" },
            { name: "Mora", price: "2.00" }
          ]
        },
        {
          id: "gaseosas-trad", title: "Gaseosas & Aguas",
          items: [
            { name: "Coca 300 ml", price: "1.00" },
            { name: "Sprite 300 ml", price: "1.00" },
            { name: "Fanta 300 ml", price: "1.00" },
            { name: "Fiora 300 ml", price: "1.00" },
            { name: "Gaseosa 1 lt", price: "2.00" },
            { name: "Gaseosa 3 lt", price: "4.00" },
            { name: "Fuze Tea 500 ml", price: "1.00" },
            { name: "Fuze Tea 1 lt", price: "2.00" },
            { name: "Agua", price: "1.00" }
          ]
        }
      ]
    }
  ];
}

// =============================================================
//  EVENTOS Y PROMOS (2 hojas: Eventos, Promos)
// =============================================================
//
// Endpoint:  GET ?action=getEvents (&nocache=1 opcional)
// Retorna:   { ok, liveEvents: [...], promosByDay: [7 items o null], generatedAt }
//
// Hojas:
//   Eventos: id | tipo | dia_semana | fecha | titulo | subtitulo | hora_inicio | hora_fin | icon | color | active
//     - tipo "recurrente": llenar dia_semana (0=Dom .. 6=Sab); fecha vacío
//     - tipo "fecha": llenar fecha (YYYY-MM-DD); dia_semana vacío
//   Promos:  dia_semana | titulo | descripcion | tipo_oferta | cantidad | precio_unidad | descuento_pct | subtitulo | imagen | active
//     - una fila por día (0-6); marca active=FALSE para ocultar (ej: Martes cerrado)

function getEvents_(opts) {
  opts = opts || {};
  var cache = CacheService.getScriptCache();
  var cacheKey = "events";
  if (!opts.nocache) {
    try {
      var cached = cache.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var eventos = readSheet_(ss, SHEETS.EVENTOS);
  var promos = readSheet_(ss, SHEETS.PROMOS);

  // Convertir eventos a formato { day, date?, title, subtitle, startHour, endHour, icon, color }
  var liveEvents = eventos
    .filter(function (e) { return truthy_(e.active); })
    .map(function (e) {
      var tipo = String(e.tipo || "").toLowerCase().trim();
      var out = {
        title: String(e.titulo || ""),
        subtitle: String(e.subtitulo || ""),
        startHour: Number(e.hora_inicio || 0),
        endHour: Number(e.hora_fin || 0),
        icon: String(e.icon || "music"),
        color: String(e.color || "#c73838")
      };
      if (tipo === "fecha") {
        out.specificDate = formatDateISO_(e.fecha);
        out.day = -1; // marcador: usar specificDate
      } else {
        out.day = parseDayOfWeek_(e.dia_semana);
      }
      return out;
    })
    .filter(function (e) {
      // Eliminar entradas inválidas
      if (e.specificDate) return !!e.specificDate;
      return e.day >= 0 && e.day <= 6;
    });

  // Convertir promos a array indexado por día (0-6)
  var promosByDay = [null, null, null, null, null, null, null];
  promos.forEach(function (p) {
    if (!truthy_(p.active)) return;
    var d = parseDayOfWeek_(p.dia_semana);
    if (d < 0 || d > 6) return;
    var ofertaTipo = String(p.tipo_oferta || "").toLowerCase().trim();
    var entry = {
      title: String(p.titulo || ""),
      description: String(p.descripcion || ""),
      offerType: ofertaTipo === "discount" ? "discount" : "combo",
      subtitle: String(p.subtitulo || ""),
      bgImage: String(p.imagen || "")
    };
    if (entry.offerType === "combo") {
      entry.qty = Number(p.cantidad || 0);
      entry.pricePerItem = Number(p.precio_unidad || 0);
    } else {
      entry.discountPct = Number(p.descuento_pct || 0);
    }
    promosByDay[d] = entry;
  });

  var result = {
    ok: true,
    liveEvents: liveEvents,
    promosByDay: promosByDay,
    generatedAt: new Date().toISOString()
  };
  try { cache.put(cacheKey, JSON.stringify(result), 300); } catch (e) {}
  return result;
}

// Helper: convierte número, nombre o cadena a número de día (0-6)
function parseDayOfWeek_(v) {
  if (v === "" || v === null || v === undefined) return -1;
  // Si ya es número
  var n = Number(v);
  if (!isNaN(n) && isFinite(n) && n >= 0 && n <= 6) return n;
  // Si es nombre
  var s = String(v).toLowerCase().trim();
  var DAYS = {
    "domingo": 0, "dom": 0, "sunday": 0, "sun": 0,
    "lunes": 1, "lun": 1, "monday": 1, "mon": 1,
    "martes": 2, "mar": 2, "tuesday": 2, "tue": 2,
    "miercoles": 3, "miércoles": 3, "mie": 3, "mié": 3, "wednesday": 3, "wed": 3,
    "jueves": 4, "jue": 4, "thursday": 4, "thu": 4,
    "viernes": 5, "vie": 5, "friday": 5, "fri": 5,
    "sabado": 6, "sábado": 6, "sab": 6, "sáb": 6, "saturday": 6, "sat": 6
  };
  return DAYS[s] !== undefined ? DAYS[s] : -1;
}

// Helper: convierte cualquier formato de fecha a "YYYY-MM-DD" o vacío
function formatDateISO_(v) {
  if (!v) return "";
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  var s = String(v).trim();
  // Si ya está en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  // Intentar parsear
  var d = new Date(s);
  if (!isNaN(d.getTime())) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return "";
}

// =============================================================
//  MIGRACION INICIAL EVENTOS (one-shot)
// =============================================================

function migrarEventosActuales() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var evSh = ensureSheet_(ss, SHEETS.EVENTOS,
    ["id", "tipo", "dia_semana", "fecha", "titulo", "subtitulo", "hora_inicio", "hora_fin", "icon", "color", "active"]);
  var prSh = ensureSheet_(ss, SHEETS.PROMOS,
    ["dia_semana", "titulo", "descripcion", "tipo_oferta", "cantidad", "precio_unidad", "descuento_pct", "subtitulo", "imagen", "active"]);

  // Protección: si las hojas ya tienen datos, pedir confirmación
  var hasData = evSh.getLastRow() > 1 || prSh.getLastRow() > 1;
  if (hasData) {
    try {
      var ui = SpreadsheetApp.getUi();
      var resp = ui.alert(
        "⚠️ Hojas de eventos ya contienen datos",
        "Si continúas, se BORRARÁN los eventos y promos editados manualmente.\n\n¿Continuar?",
        ui.ButtonSet.YES_NO
      );
      if (resp !== ui.Button.YES) {
        ui.alert("Migración cancelada.");
        return;
      }
    } catch (e) {
      throw new Error("Las hojas ya tienen datos. Confirma desde el editor.");
    }
  }

  // Limpia datos previos
  if (evSh.getLastRow() > 1) evSh.getRange(2, 1, evSh.getLastRow() - 1, evSh.getLastColumn()).clearContent();
  if (prSh.getLastRow() > 1) prSh.getRange(2, 1, prSh.getLastRow() - 1, prSh.getLastColumn()).clearContent();

  // Eventos recurrentes (semilla del sitio actual)
  var eventos = [
    { tipo: "recurrente", dia_semana: 5, titulo: "Viernes de Karaoke",
      subtitulo: "Abre tus cuerdas vocales con un cóctel en mano",
      hora_inicio: 20, hora_fin: 24, icon: "mic", color: "#c73838" },
    { tipo: "recurrente", dia_semana: 6, titulo: "DJ en vivo",
      subtitulo: "La mejor música para una noche de parrilla",
      hora_inicio: 21, hora_fin: 2, icon: "music", color: "#c9a35a" },
    { tipo: "recurrente", dia_semana: 4, titulo: "Jueves gastronómico",
      subtitulo: "Maridajes especiales con el chef",
      hora_inicio: 19, hora_fin: 23, icon: "chef-hat", color: "#8b2323" }
  ];
  eventos.forEach(function (e, i) {
    evSh.appendRow([
      "EV" + (i + 1).toString().padStart(3, "0"),
      e.tipo, e.dia_semana, "", e.titulo, e.subtitulo,
      e.hora_inicio, e.hora_fin, e.icon, e.color, true
    ]);
  });

  // Promos por día (semilla del sitio actual)
  var promos = [
    { dia_semana: 0, titulo: "Domingo de mariscos",
      descripcion: "10% de descuento en todos los mariscos del menú.",
      tipo_oferta: "discount", cantidad: "", precio_unidad: "", descuento_pct: 10,
      subtitulo: "en mariscos", imagen: "/dishes/ceviche.webp", active: true },
    { dia_semana: 1, titulo: "Lunes de Grilles",
      descripcion: "Lleva 2 platos de Grilles y aprovecha el especial del día.",
      tipo_oferta: "combo", cantidad: 2, precio_unidad: 12.5, descuento_pct: "",
      subtitulo: "en Grilles", imagen: "/dishes/grill-hero.webp", active: true },
    // Martes: cerrado, no se incluye (active=FALSE no es lo mismo que ausente)
    { dia_semana: 3, titulo: "Miércoles de Costillas",
      descripcion: "2 platos de costillas premium a precio especial.",
      tipo_oferta: "combo", cantidad: 2, precio_unidad: 30.0, descuento_pct: "",
      subtitulo: "en Costillas", imagen: "/dishes/grill-hero.webp", active: true },
    { dia_semana: 4, titulo: "Jueves de Ribeyes",
      descripcion: "Doble corte Ribeye a precio especial.",
      tipo_oferta: "combo", cantidad: 2, precio_unidad: 26.0, descuento_pct: "",
      subtitulo: "en Ribeyes", imagen: "/dishes/grill-hero.webp", active: true },
    { dia_semana: 5, titulo: "Viernes de Cócteles",
      descripcion: "3 cócteles seleccionados a $10 c/u — perfecto para arrancar el finde.",
      tipo_oferta: "combo", cantidad: 3, precio_unidad: 10.0, descuento_pct: "",
      subtitulo: "en cócteles seleccionados", imagen: "/dishes/cocktails.webp", active: true },
    { dia_semana: 6, titulo: "Sábado de Micheladas",
      descripcion: "3 micheladas heladas por $5 c/u — refresca tu finde.",
      tipo_oferta: "combo", cantidad: 3, precio_unidad: 5.0, descuento_pct: "",
      subtitulo: "en Micheladas", imagen: "/dishes/micheladas.webp", active: true }
  ];
  promos.forEach(function (p) {
    prSh.appendRow([
      p.dia_semana, p.titulo, p.descripcion, p.tipo_oferta,
      p.cantidad, p.precio_unidad, p.descuento_pct, p.subtitulo, p.imagen, p.active
    ]);
  });

  try {
    SpreadsheetApp.getUi().alert(
      "Eventos migrados.\n\n" +
      "Hojas creadas: Eventos, Promos\n\n" +
      "Edita los items directamente. Para evento de FECHA específica:\n" +
      "  - tipo = fecha\n" +
      "  - dia_semana vacío\n" +
      "  - fecha = 2026-05-15 (formato YYYY-MM-DD)\n\n" +
      "Cambios visibles en ~5 min o inmediato con Cmd+Shift+R."
    );
  } catch (e) {}
}

// =============================================================
//  GALERIA (1 hoja: Galeria — secciones cocina y galeria)
// =============================================================
//
// Endpoint:  GET ?action=getGallery (&nocache=1 opcional)
// Retorna:   { ok, cocina: [...], galeria: [...], generatedAt }
//
// Hoja Galeria:
//   seccion | tipo | src | poster | titulo | descripcion | order | active
//
//   - seccion: "cocina" o "galeria"
//   - tipo: "image" o "video" (video solo aplica en cocina)
//   - src: URL de Drive, ruta local (/dishes/foo.webp), o YouTube ID
//   - poster: URL de imagen preview (solo si tipo=video)
//   - titulo: texto que se muestra (en galeria es el caption)
//   - descripcion: solo para cocina, opcional

function getGallery_(opts) {
  opts = opts || {};
  var cache = CacheService.getScriptCache();
  var cacheKey = "gallery";
  if (!opts.nocache) {
    try {
      var cached = cache.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rows = readSheet_(ss, SHEETS.GALERIA);
  var cocina = [];
  var galeria = [];

  rows
    .filter(function (r) { return truthy_(r.active); })
    .sort(function (a, b) { return Number(a.order || 0) - Number(b.order || 0); })
    .forEach(function (r) {
      var seccion = String(r.seccion || "").toLowerCase().trim();
      var tipo = String(r.tipo || "image").toLowerCase().trim();
      var src = String(r.src || "").trim();
      // Si parece URL de Drive, convertir a thumbnail
      var srcOut = (tipo === "video") ? videoEmbedUrl_(src) : driveImageUrl_(src);
      var item = {
        type: tipo === "video" ? "video" : "image",
        src: srcOut,
        title: String(r.titulo || "")
      };
      if (tipo === "video" && r.poster) item.poster = driveImageUrl_(String(r.poster));
      if (r.descripcion) item.description = String(r.descripcion);

      if (seccion === "cocina") cocina.push(item);
      else if (seccion === "galeria") galeria.push(item);
    });

  var result = {
    ok: true,
    cocina: cocina,
    galeria: galeria,
    generatedAt: new Date().toISOString()
  };
  try { cache.put(cacheKey, JSON.stringify(result), 300); } catch (e) {}
  return result;
}

// =============================================================
//  MIGRACION INICIAL GALERIA (one-shot)
// =============================================================

function migrarGaleriaActual() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ensureSheet_(ss, SHEETS.GALERIA,
    ["seccion", "tipo", "src", "poster", "titulo", "descripcion", "order", "active"]);

  // Protección
  if (sh.getLastRow() > 1) {
    try {
      var ui = SpreadsheetApp.getUi();
      var resp = ui.alert(
        "⚠️ Hoja Galeria ya contiene datos",
        "Si continúas, se BORRARÁN las imágenes y descripciones editadas manualmente.\n\n¿Continuar?",
        ui.ButtonSet.YES_NO
      );
      if (resp !== ui.Button.YES) {
        ui.alert("Migración cancelada.");
        return;
      }
    } catch (e) {
      throw new Error("La hoja ya tiene datos. Confirma desde el editor.");
    }
    sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
  }

  // Cocina (sección "Detrás del fuego" / Nuestra cocina)
  var cocina = [
    { tipo: "image", src: "/dishes/grill-hero.webp", titulo: "Al fuego vivo",
      descripcion: "Cortes premium de res Brangus sellados sobre brasas directas." },
    { tipo: "image", src: "/dishes/tigrillo.webp", titulo: "Tigrillo de la mañana",
      descripcion: "Plátano verde majado con chicharrones y huevo." },
    { tipo: "image", src: "/dishes/salmon.webp", titulo: "Salmón en salsa de naranja",
      descripcion: "El plato firma del chef — reducción cítrica sobre papas chauchas." },
    { tipo: "image", src: "/dishes/ceviche.webp", titulo: "Ceviche fresco",
      descripcion: "Camarón, lima y ají suave con un toque peruano." },
    { tipo: "image", src: "/dishes/burgers-pizza.webp", titulo: "Pizza artesanal",
      descripcion: "Masa madre fermentada 24 horas y horneada al momento." },
    { tipo: "image", src: "/dishes/cocktails.webp", titulo: "Bar en acción",
      descripcion: "Mojitos, margaritas y sangrías preparadas al momento." }
  ];
  cocina.forEach(function (c, i) {
    sh.appendRow(["cocina", c.tipo, c.src, "", c.titulo, c.descripcion, i + 1, true]);
  });

  // Galeria (sección Momentos compartidos / clientes)
  var galeria = [
    { src: "/customers/client-3.webp", titulo: "Cenas con velas" },
    { src: "/customers/client-2.webp", titulo: "Entre amigos" },
    { src: "/customers/client-4.webp", titulo: "Celebrando momentos" },
    { src: "/customers/client-1.webp", titulo: "Ambiente Corte Piedra" },
    { src: "/customers/client-5.webp", titulo: "Sobremesa con copas" },
    { src: "/customers/client-8.webp", titulo: "Noches que quedan" },
    { src: "/customers/client-6.webp", titulo: "Reuniones especiales" },
    { src: "/customers/client-9.webp", titulo: "Buena mesa" }
  ];
  galeria.forEach(function (g, i) {
    sh.appendRow(["galeria", "image", g.src, "", g.titulo, "", i + 1, true]);
  });

  try {
    SpreadsheetApp.getUi().alert(
      "Galería migrada.\n\n" +
      "Hoja: Galeria (1 sola hoja con columna seccion).\n" +
      "  - seccion = cocina → aparece en sección 'Nuestra cocina'\n" +
      "  - seccion = galeria → aparece en sección 'Momentos compartidos'\n\n" +
      "Para subir nuevas fotos: súbelas a Drive (carpeta Menu Imagenes) y pega el link en src."
    );
  } catch (e) {}
}

// =============================================================
//  AUTOMATIZACION DE EMAILS DE EVENTOS
// =============================================================

/**
 * Configura los triggers de eventos:
 *  1) onEdit instantaneo en la hoja: cuando agregas un evento con active=TRUE
 *     se envia el correo de anuncio INMEDIATAMENTE (una sola vez).
 *  2) Cron diario 9 AM: envia recordatorios de eventos que ocurren manana.
 * Ejecutar UNA vez desde el editor de Apps Script.
 */
function installTriggerEventos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var name = triggers[i].getHandlerFunction();
    if (name === "dailyEventosJob" || name === "onEditEventosTrigger") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Trigger 1: onEdit instantaneo para anuncios de evento nuevo
  ScriptApp.newTrigger("onEditEventosTrigger")
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  // Trigger 2: cron diario 9 AM para recordatorios "manana es el evento"
  ScriptApp.newTrigger("dailyEventosJob")
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();

  try {
    SpreadsheetApp.getUi().alert(
      "Triggers de eventos instalados:\n" +
      " - Anuncio inmediato al marcar active=TRUE en la hoja Eventos.\n" +
      " - Recordatorio diario a las 9:00 AM para eventos del dia siguiente."
    );
  } catch (e) {}
}

/**
 * Job diario (9 AM): solo recordatorios "manana es el evento".
 * Tambien corre verificarNuevosEventos_ como red de seguridad por si
 * el onEdit trigger fallo o el evento se agrego con el trigger desinstalado.
 */
function dailyEventosJob() {
  verificarNuevosEventos_();   // safety net (idempotente)
  recordatorioEventoManana_();
}

/**
 * Handler del trigger onEdit instalable.
 * Cuando se edita la hoja Eventos, revisa si hay eventos con active=TRUE
 * y notificado != TRUE, y envia el email de anuncio inmediatamente.
 *
 * Es seguro porque verificarNuevosEventos_ es idempotente:
 *  - Solo procesa filas con active=TRUE
 *  - Marca notificado=TRUE despues de enviar
 *  - Filas ya notificadas se saltan
 */
function onEditEventosTrigger(e) {
  try {
    if (!e || !e.range) return;
    var sh = e.range.getSheet();
    if (!sh || sh.getName() !== SHEETS.EVENTOS) return;
    // Pequena espera para que el usuario termine de tipear la fila completa
    // (si setea active=TRUE despues de llenar lo demas, no afecta).
    Utilities.sleep(1500);
    verificarNuevosEventos_();
  } catch (err) {
    Logger.log("Error onEditEventosTrigger: " + err);
  }
}

/**
 * Escanea la hoja Eventos buscando filas con notificado != TRUE.
 * Para cada una: envia email de anuncio a todos los clientes y marca notificado=TRUE.
 */
function verificarNuevosEventos_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.EVENTOS);
  if (!sh || sh.getLastRow() < 2) return;

  // Encontrar o crear columna "notificado"
  var lastCol = sh.getLastColumn();
  var headerRow = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var headers = headerRow.map(function(h) { return String(h).trim(); });
  var notifColIdx = headers.indexOf("notificado"); // 0-based
  if (notifColIdx < 0) {
    notifColIdx = lastCol; // 0-based index de la nueva columna
    sh.getRange(1, lastCol + 1).setValue("notificado");
    lastCol = lastCol + 1;
  }
  var notifCol1 = notifColIdx + 1; // 1-based para getRange

  var data = sh.getRange(2, 1, sh.getLastRow() - 1, lastCol).getValues();
  var clients = getAllActiveClients_();
  if (clients.length === 0) return;

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    // Construir objeto evento desde headers
    var evento = {};
    for (var h = 0; h < headers.length; h++) {
      evento[headers[h]] = row[h];
    }
    var notifVal = row[notifColIdx];
    if (!truthy_(evento.active)) continue;
    if (truthy_(notifVal)) continue; // ya notificado

    try {
      enviarEmailAnuncioEvento_(evento, clients);
      sh.getRange(i + 2, notifCol1).setValue(true);
      SpreadsheetApp.flush();
    } catch (err) {
      Logger.log("Error notificando evento " + evento.id + ": " + err);
    }
  }
}

/**
 * Busca eventos de tipo "fecha" que ocurren manana y envia recordatorio a todos los clientes.
 */
function recordatorioEventoManana_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var tomorrowISO = Utilities.formatDate(tomorrow, Session.getScriptTimeZone(), "yyyy-MM-dd");

  var eventos = readSheet_(ss, SHEETS.EVENTOS);
  var clients = getAllActiveClients_();
  if (clients.length === 0) return;

  var manana = eventos.filter(function(e) {
    if (!truthy_(e.active)) return false;
    if (String(e.tipo || "").toLowerCase().trim() !== "fecha") return false;
    return formatDateISO_(e.fecha) === tomorrowISO;
  });

  manana.forEach(function(evento) {
    try {
      enviarEmailRecordatorio_(evento, clients);
    } catch (err) {
      Logger.log("Error recordatorio evento " + evento.id + ": " + err);
    }
  });
}

/**
 * Retorna todos los clientes que tienen email valido registrado.
 */
function getAllActiveClients_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.CLI);
  if (!sh || sh.getLastRow() < 2) return [];
  var rows = sh.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var email = String(rows[i][3] || "").trim();
    if (email && email.indexOf("@") > 0) {
      result.push({ nombre: String(rows[i][1] || "Cliente"), email: email });
    }
  }
  return result;
}

/**
 * Envia email de anuncio de nuevo evento a la lista de clientes.
 */
function enviarEmailAnuncioEvento_(evento, clients) {
  var cfg = readConfig_();
  var nombre = cfg.restaurante_nombre || "Corte Piedra";
  var titulo = String(evento.titulo || "Nuevo Evento");
  var subtitulo = String(evento.subtitulo || "");
  var fecha = formatFechaEventoTexto_(evento);
  var hora = formatHoraEvento_(evento);
  var subject = "Nuevo evento: " + titulo + " - " + nombre;
  var html = buildEmailEvento_(nombre, titulo, subtitulo, fecha, hora, "Nuevo evento", "#c73838");
  for (var i = 0; i < clients.length; i++) {
    try {
      MailApp.sendEmail({ to: clients[i].email, subject: subject, htmlBody: html, name: nombre });
    } catch (e) {
      Logger.log("Error email anuncio a " + clients[i].email + ": " + e);
    }
  }
}

/**
 * Envia email de recordatorio (el evento es manana) a la lista de clientes.
 */
function enviarEmailRecordatorio_(evento, clients) {
  var cfg = readConfig_();
  var nombre = cfg.restaurante_nombre || "Corte Piedra";
  var titulo = String(evento.titulo || "Evento");
  var subtitulo = String(evento.subtitulo || "");
  var fecha = formatFechaEventoTexto_(evento);
  var hora = formatHoraEvento_(evento);
  var subject = "Manana: " + titulo + " - " + nombre;
  var html = buildEmailEvento_(nombre, titulo, subtitulo, fecha, hora, "Recordatorio: manana es el evento", "#c9a35a");
  for (var i = 0; i < clients.length; i++) {
    try {
      MailApp.sendEmail({ to: clients[i].email, subject: subject, htmlBody: html, name: nombre });
    } catch (e) {
      Logger.log("Error email recordatorio a " + clients[i].email + ": " + e);
    }
  }
}

/**
 * Construye el HTML del email de evento. Reutilizado por anuncio y recordatorio.
 */
function buildEmailEvento_(restaurante, titulo, subtitulo, fecha, hora, badge, accentColor) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
    '<body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,serif;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:40px 20px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;background:#000;border:1px solid rgba(200,32,46,0.3);border-radius:20px;overflow:hidden;">' +
    '<tr><td style="padding:40px 30px 20px;text-align:center;">' +
    '<p style="color:' + accentColor + ';font-size:11px;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 6px;font-family:Arial,sans-serif;">' + badge + '</p>' +
    '<h1 style="color:#fff;font-size:26px;margin:0 0 8px;font-weight:900;">' + titulo + '</h1>' +
    (subtitulo ? '<p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0;">' + subtitulo + '</p>' : '') +
    '</td></tr>' +
    '<tr><td style="padding:20px 30px;">' +
    '<div style="background:linear-gradient(135deg,rgba(200,32,46,0.12),rgba(139,22,33,0.08));border:1px solid rgba(200,32,46,0.3);border-radius:14px;padding:24px 20px;text-align:center;">' +
    '<p style="color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;font-family:Arial,sans-serif;">Cuando</p>' +
    '<p style="color:#fff;font-size:20px;font-weight:700;margin:0 0 4px;font-family:Arial,sans-serif;">' + fecha + '</p>' +
    (hora ? '<p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0;font-family:Arial,sans-serif;">' + hora + '</p>' : '') +
    '</div></td></tr>' +
    '<tr><td style="padding:10px 30px 36px;text-align:center;">' +
    '<p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;margin:0;font-family:Arial,sans-serif;">Te esperamos. Reserva tu mesa antes de que se llene.</p>' +
    '<p style="color:rgba(255,255,255,0.4);font-size:11px;line-height:1.5;margin:16px 0 0;font-family:Arial,sans-serif;">Si no deseas recibir estos correos, comunicate con nosotros.</p>' +
    '</td></tr>' +
    '<tr><td style="padding:20px 30px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">' +
    '<p style="color:rgba(255,255,255,0.3);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:0;font-family:Arial,sans-serif;">' + restaurante + ' · Experiencia Gourmet en Cada Bocado</p>' +
    '</td></tr></table></td></tr></table></body></html>';
}

/**
 * Devuelve texto legible de fecha o dia de semana del evento.
 */
function formatFechaEventoTexto_(evento) {
  var tipo = String(evento.tipo || "").toLowerCase().trim();
  if (tipo === "fecha") {
    var iso = formatDateISO_(evento.fecha);
    // Parsear como fecha local (yyyy-MM-dd) evitando desfase UTC
    var parts = iso.split("-");
    if (parts.length === 3) {
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (!isNaN(d.getTime())) {
        return Utilities.formatDate(d, Session.getScriptTimeZone(), "dd 'de' MMMM 'de' yyyy");
      }
    }
    return iso;
  }
  var dias = ["Domingos", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabados"];
  var n = parseDayOfWeek_(evento.dia_semana);
  return n >= 0 ? "Cada " + dias[n] : String(evento.dia_semana || "");
}

/**
 * Devuelve texto de horario del evento (ej: "20:00 - 24:00").
 */
function formatHoraEvento_(evento) {
  var ini = Number(evento.hora_inicio || 0);
  var fin = Number(evento.hora_fin || 0);
  if (!ini && !fin) return "";
  function pad(h) { return (h < 10 ? "0" : "") + h + ":00"; }
  return pad(ini) + " - " + pad(fin);
}

/**
 * Funcion de prueba: envia un email de anuncio de evento al email del dueno.
 * Ejecutar manualmente desde el editor para verificar que los emails llegan bien.
 */
function testEmailEvento() {
  var cfg = readConfig_();
  var recipients = String(cfg.restaurante_email_dueno || "")
    .split(",")
    .map(function(s) { return s.trim(); })
    .filter(function(s) { return !!s; });
  if (recipients.length === 0) {
    Logger.log("No hay email de dueno configurado en la hoja Configuracion.");
    return;
  }
  var eventoTest = {
    tipo: "fecha", fecha: new Date(), titulo: "Noche de Gala TEST",
    subtitulo: "Cena especial con musica en vivo", hora_inicio: 20, hora_fin: 23,
    icon: "music", color: "#c73838", active: true
  };
  var clients = recipients.map(function(e) { return { nombre: "Dueno", email: e }; });
  enviarEmailAnuncioEvento_(eventoTest, clients);
  Logger.log("Email de prueba enviado a: " + recipients.join(", "));
}

// =============================================================
//  README (pasos de setup)
// =============================================================
// 1. Crea un Google Sheet vacio
// 2. Extensiones -> Apps Script -> pega TODO este codigo
// 3. Guarda con nombre "Corte Piedra API"
// 4. Ejecuta setup() -> autoriza permisos -> crea 7 hojas
// 5. Edita la hoja Configuracion:
//    - restaurante_email_dueno (emails separados por coma)
//    - restaurante_lat, restaurante_lng (coords GPS reales del local)
//    - radio_metros (50 recomendado)
// 6. Ejecuta installTrigger() -> cron diario 6 AM (contrasena del dia)
// 7. Ejecuta installTriggerEventos() -> instala 2 triggers:
//    - Anuncio inmediato cuando agregas un evento con active=TRUE
//    - Cron diario 9 AM con recordatorios "manana es el evento"
// 8. Opcional: ejecuta testGeneratePassword() para probar el email de contrasena
// 9. Opcional: ejecuta testEmailEvento() para probar el email de eventos
// 10. Implementar -> Nueva implementacion -> Web app:
//    - Ejecutar como: Yo
//    - Quien tiene acceso: Cualquier usuario
// 11. Copia la URL que termina en /exec
// 10. Pegala en lib/config.ts -> loyaltyApi
