import { CONFIG } from "./config";

export type LoyaltyClient = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  fecha_registro: string;
  puntos_actuales: number;
  puntos_totales_historicos: number;
  nivel: "Bronce" | "Plata" | "Oro";
  acepto_terminos: boolean;
  fecha_aceptacion: string;
  ultima_acumulacion: string | null;
};

export type LoyaltyConfig = {
  restaurante_nombre: string;
  restaurante_lat: number;
  restaurante_lng: number;
  radio_metros: number;
  puntos_por_visita: number;
  cooldown_horas: number;
  sesion_minutos: number;
  nivel_bronce_min: number;
  nivel_plata_min: number;
  nivel_oro_min: number;
};

export const LOYALTY_STORAGE_KEY = "cp-loyalty-session";

// ──────────────────────────────────────────────────────────
// Utils
// ──────────────────────────────────────────────────────────

export function normalizePhone(p: string): string {
  return p.replace(/\D/g, "").replace(/^0/, "593");
}

/** Haversine — distancia en metros entre dos puntos GPS */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371e3;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lon2 - lon1);
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ──────────────────────────────────────────────────────────
// Cliente API — POSTea al Apps Script Web App
// ──────────────────────────────────────────────────────────

/** Genera un idempotency key único por request (evita doble-conteo en reintentos). */
function genIdempotencyKey(): string {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}

/**
 * POST al endpoint loyalty con:
 *  - timeout 8s (guía sección 8)
 *  - 1 reintento automático ante fallos de red / respuesta inválida
 *  - idempotencyKey para que el reintento no duplique transacciones
 *  - errores con mensaje específico (no genérico "No se pudo conectar")
 */
async function apiPost<T = unknown>(body: Record<string, unknown>): Promise<T> {
  if (!CONFIG.loyaltyApi) {
    // Modo demo / sin backend
    return demoMock(body) as T;
  }

  // Inyecta idempotencyKey si no viene
  const payload = {
    idempotencyKey: genIdempotencyKey(),
    ...body,
  };

  const attempt = async (): Promise<T> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(CONFIG.loyaltyApi, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
        cache: "no-store",
      });
      const text = await res.text();
      // Detecta respuesta HTML (típicamente auth page de Google si proxy falló)
      if (text.trimStart().startsWith("<")) {
        console.error("[loyalty] respuesta HTML:", res.status, text.slice(0, 200));
        throw new Error(`Respuesta no-JSON del servidor (${res.status})`);
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        console.error("[loyalty] respuesta no-JSON:", res.status, text.slice(0, 200));
        throw new Error(`Respuesta inválida (${res.status})`);
      }
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    return await attempt();
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.warn("[loyalty] primer intento falló, reintentando:", err);
    try {
      return await attempt();
    } catch (err2) {
      console.error("[loyalty] fetch falló (2 intentos):", err2);
      if (isAbort || (err2 instanceof Error && err2.name === "AbortError")) {
        throw new Error("Tiempo de espera agotado. Verifica tu conexión.");
      }
      // Re-throw con el mensaje original para que la UI lo muestre
      throw err2 instanceof Error ? err2 : new Error(String(err2));
    }
  }
}

export async function apiRegister(input: {
  nombre: string;
  telefono: string;
  email: string;
  acepto_terminos: boolean;
}) {
  return apiPost<{ ok: boolean; client?: LoyaltyClient; error?: string }>({
    action: "register",
    ...input,
    telefono: normalizePhone(input.telefono),
  });
}

export async function apiLogin(telefono: string) {
  return apiPost<{ ok: boolean; client?: LoyaltyClient; error?: string }>({
    action: "login",
    telefono: normalizePhone(telefono),
  });
}

export async function apiGetClient(telefono: string) {
  return apiPost<{ ok: boolean; client?: LoyaltyClient; error?: string }>({
    action: "getClient",
    telefono: normalizePhone(telefono),
  });
}

export async function apiAccumulate(telefono: string, password: string) {
  return apiPost<{
    ok: boolean;
    client?: LoyaltyClient;
    pointsAwarded?: number;
    error?: string;
    hoursLeft?: number;
  }>({
    action: "accumulate",
    telefono: normalizePhone(telefono),
    password,
  });
}

export async function apiGetConfig(): Promise<{
  ok: boolean;
  config?: LoyaltyConfig;
}> {
  return apiPost({ action: "getConfig" });
}

// ──────────────────────────────────────────────────────────
// Session (localStorage)
// ──────────────────────────────────────────────────────────

export type LoyaltySession = {
  client: LoyaltyClient;
  timestamp: number;
};

export function saveSession(client: LoyaltyClient) {
  const s: LoyaltySession = { client, timestamp: Date.now() };
  localStorage.setItem(LOYALTY_STORAGE_KEY, JSON.stringify(s));
}

export function loadSession(sessionMinutes = 60): LoyaltySession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOYALTY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LoyaltySession;
    const age = Date.now() - parsed.timestamp;
    if (age > sessionMinutes * 60 * 1000) {
      localStorage.removeItem(LOYALTY_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(LOYALTY_STORAGE_KEY);
}

// ──────────────────────────────────────────────────────────
// DEMO fallback — sin backend funciona con localStorage
// ──────────────────────────────────────────────────────────

const DEMO_DB_KEY = "cp-loyalty-demo-db";

function demoDb(): Record<string, LoyaltyClient> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DEMO_DB_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDemoDb(db: Record<string, LoyaltyClient>) {
  localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));
}

function demoMock(body: Record<string, unknown>): unknown {
  const phone = normalizePhone(String(body.telefono || ""));
  const db = demoDb();
  const action = body.action;

  if (action === "register") {
    if (db[phone])
      return { ok: true, client: db[phone], existed: true };
    const client: LoyaltyClient = {
      id: "demo-" + phone,
      nombre: String(body.nombre || ""),
      telefono: phone,
      email: String(body.email || ""),
      fecha_registro: new Date().toISOString(),
      puntos_actuales: 0,
      puntos_totales_historicos: 0,
      nivel: "Bronce",
      acepto_terminos: !!body.acepto_terminos,
      fecha_aceptacion: new Date().toISOString(),
      ultima_acumulacion: null,
    };
    db[phone] = client;
    saveDemoDb(db);
    return { ok: true, client };
  }
  if (action === "login") {
    if (!db[phone]) return { ok: false, error: "not_found" };
    return { ok: true, client: db[phone] };
  }
  if (action === "getClient") {
    if (!db[phone]) return { ok: false, error: "not_found" };
    return { ok: true, client: db[phone] };
  }
  if (action === "accumulate") {
    if (!db[phone]) return { ok: false, error: "not_found" };
    // En demo aceptamos cualquier password de 6 dígitos
    const pw = String(body.password || "");
    if (!/^\d{6}$/.test(pw)) return { ok: false, error: "wrong_password" };
    const c = db[phone];
    // cooldown 24 h
    if (c.ultima_acumulacion) {
      const h =
        (Date.now() - new Date(c.ultima_acumulacion).getTime()) / 36e5;
      if (h < 24) return { ok: false, error: "cooldown", hoursLeft: Math.ceil(24 - h) };
    }
    c.puntos_actuales += 50;
    c.puntos_totales_historicos += 50;
    c.nivel =
      c.puntos_totales_historicos >= 1500
        ? "Oro"
        : c.puntos_totales_historicos >= 500
          ? "Plata"
          : "Bronce";
    c.ultima_acumulacion = new Date().toISOString();
    db[phone] = c;
    saveDemoDb(db);
    return { ok: true, pointsAwarded: 50, client: c };
  }
  if (action === "getConfig") {
    return {
      ok: true,
      config: {
        restaurante_nombre: "Corte Piedra",
        restaurante_lat: -3.6833,
        restaurante_lng: -79.6833,
        radio_metros: 999999, // DEMO: no valida GPS
        puntos_por_visita: 50,
        cooldown_horas: 24,
        sesion_minutos: 60,
        nivel_bronce_min: 0,
        nivel_plata_min: 500,
        nivel_oro_min: 1500,
      },
    };
  }
  return { ok: false, error: "demo_unknown" };
}

export function isDemoMode(): boolean {
  return !CONFIG.loyaltyApi;
}
