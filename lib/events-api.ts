/**
 * Events API client — fetch events and promos from Apps Script.
 *
 * Strategy:
 *   - localStorage cache (TTL 5 min)
 *   - Server cache 5 min (Apps Script CacheService)
 *   - Fallback: caller uses CONFIG static data when this returns null
 *
 * Mirrors menu-api.ts pattern.
 */
import { CONFIG } from "./config";

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_KEY = "cp_events";

export type LiveEvent = {
  day: number; // 0-6 (-1 if specificDate is set)
  title: string;
  subtitle: string;
  startHour: number;
  endHour: number;
  icon: string;
  color: string;
  specificDate?: string; // YYYY-MM-DD para eventos de fecha específica
};

export type Promo =
  | {
      title: string;
      description: string;
      offerType: "combo";
      qty: number;
      pricePerItem: number;
      subtitle: string;
      bgImage: string;
    }
  | {
      title: string;
      description: string;
      offerType: "discount";
      discountPct: number;
      subtitle: string;
      bgImage: string;
    };

export type EventsPayload = {
  liveEvents: LiveEvent[];
  promosByDay: (Promo | null)[];
};

type EventsResponse = {
  ok: boolean;
  liveEvents: LiveEvent[];
  promosByDay: (Promo | null)[];
  generatedAt: string;
};

type CacheEntry = {
  data: EventsPayload;
  ts: number;
};

function readCache(): CacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(data: EventsPayload) {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = { data, ts: Date.now() };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}

async function fetchAndCache(): Promise<EventsPayload | null> {
  if (!CONFIG.loyaltyApi) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  const url = `${CONFIG.loyaltyApi}?action=getEvents&nocache=1&t=${Date.now()}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: ctrl.signal,
      redirect: "follow",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[events-api] HTTP ${res.status}`);
      return null;
    }
    const text = await res.text();
    if (text.trimStart().startsWith("<")) {
      console.error("[events-api] HTML response");
      return null;
    }
    let json: EventsResponse;
    try {
      json = JSON.parse(text) as EventsResponse;
    } catch (parseErr) {
      console.error("[events-api] JSON parse failed:", parseErr);
      return null;
    }
    if (!json || !json.ok || !Array.isArray(json.liveEvents) || !Array.isArray(json.promosByDay)) {
      console.error("[events-api] Invalid shape:", json);
      return null;
    }
    const payload: EventsPayload = {
      liveEvents: json.liveEvents,
      promosByDay: json.promosByDay,
    };
    writeCache(payload);
    console.log(
      `[events-api] ✓ Fetched ${json.liveEvents.length} events, ${json.promosByDay.filter(Boolean).length} promos. generatedAt=${json.generatedAt}`,
    );
    return payload;
  } catch (err) {
    console.error("[events-api] ✗ Fetch failed:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchEvents(): Promise<EventsPayload | null> {
  const cached = readCache();
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    setTimeout(() => {
      void fetchAndCache();
    }, 0);
    return cached.data;
  }
  return fetchAndCache();
}

export async function refreshEvents(): Promise<EventsPayload | null> {
  return fetchAndCache();
}

export function clearEventsCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
