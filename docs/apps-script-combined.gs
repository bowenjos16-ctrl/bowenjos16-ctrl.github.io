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
  MENU_ITM: "Menu_Items"
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
    "acepto_terminos", "fecha_aceptacion", "ultima_acumulacion"
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
  if (action === "getMenu") return json_(getMenu_((e.parameter.kind || "regular")));
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
      case "getMenu":    return json_(getMenu_(data.kind || "regular"));
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
    var stars = data.stars;
    var subject = "Nueva calificacion: " + stars + "/5 - " + cfg.restaurante_nombre;
    var body =
      "Estrellas: " + stars + "/5\n" +
      "Nombre: " + (data.name || "Anonimo") + "\n" +
      "Comentario: " + (data.comment || "(sin comentario)") + "\n" +
      "Fecha: " + new Date().toLocaleString("es-EC") + "\n\n" +
      (stars >= 4 ? "Calificacion positiva - invitado a Google Reviews."
       : stars <= 2 ? "BAJA. Contacta al cliente."
       : "Neutra.") +
      "\n\n-- Bot Menu Corte Piedra";

    for (var i = 0; i < recipients.length; i++) {
      MailApp.sendEmail(recipients[i], subject, body);
    }

    return json_({ ok: true });
  } catch (e) {
    return json_({ ok: false, error: String(e) });
  }
}

// =============================================================
//  LOYALTY endpoints
// =============================================================

function register_(data) {
  var phone = normalizePhone_(data.telefono);
  if (!data.nombre || !phone || !data.email) return { ok: false, error: "missing" };
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
    true, now, ""
  ]);
  return { ok: true, client: findClientByPhone_(phone) };
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
    ultima_acumulacion: r[10]
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

function getMenu_(menuKind) {
  var cache = CacheService.getScriptCache();
  var cacheKey = "menu:" + menuKind;
  try {
    var cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

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
              if (i.price !== "" && i.price !== null && i.price !== undefined) out.price = String(i.price);
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

// Invalida cache manualmente (útil tras editar el Sheet y querer ver cambios ya)
function invalidarCacheMenu() {
  var cache = CacheService.getScriptCache();
  cache.remove("menu:regular");
  cache.remove("menu:tradicional");
  try {
    SpreadsheetApp.getUi().alert("Cache de menú limpiada. El próximo fetch leerá datos frescos del Sheet.");
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
// 6. Ejecuta installTrigger() -> cron diario 6 AM
// 7. Opcional: ejecuta testGeneratePassword() para probar el email
// 8. Implementar -> Nueva implementacion -> Web app:
//    - Ejecutar como: Yo
//    - Quien tiene acceso: Cualquier usuario
// 9. Copia la URL que termina en /exec
// 10. Pegala en lib/config.ts -> loyaltyApi
