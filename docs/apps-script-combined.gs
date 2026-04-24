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
  FAIL: "Intentos_Fallidos"
};

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
  return ContentService
    .createTextOutput("Corte Piedra API")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || "{}";
    var data = JSON.parse(raw);
    var action = data.action || (e && e.parameter && e.parameter.action);

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
