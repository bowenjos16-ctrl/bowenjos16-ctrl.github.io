/**
 * Menu API client — fetch menu data from Apps Script with localStorage caching.
 *
 * Strategy:
 *   - localStorage cache (TTL 5 min, stale-while-revalidate)
 *   - Server cache 5 min (Apps Script CacheService)
 *   - Fallback: caller uses static menu-data.ts when this returns null
 *
 * Uses GET because POST to Apps Script Web App fails with 405 after the
 * 302 redirect to script.googleusercontent.com (POST is rejected on the
 * redirected URL). GET works correctly with CORS (Access-Control-Allow-Origin: *).
 */
import { CONFIG } from "./config";
import type { MenuCategory } from "./menu-data";
import type { MenuKind } from "./menu-schedule";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const CACHE_KEY_PREFIX = "cp_menu_";

type MenuResponse = {
  ok: boolean;
  kind: MenuKind;
  data: MenuCategory[];
  generatedAt: string;
};

type CacheEntry = {
  data: MenuCategory[];
  ts: number;
};

function readCache(kind: MenuKind): CacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY_PREFIX + kind);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(kind: MenuKind, data: MenuCategory[]) {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = { data, ts: Date.now() };
    window.localStorage.setItem(CACHE_KEY_PREFIX + kind, JSON.stringify(entry));
  } catch {
    /* localStorage full or disabled — ignore */
  }
}

async function fetchAndCache(kind: MenuKind): Promise<MenuCategory[] | null> {
  if (!CONFIG.loyaltyApi) {
    console.warn("[menu-api] No loyaltyApi URL configured");
    return null;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  // nocache=1 bypassea el cache server-side (Apps Script CacheService).
  // Combinado con cache cliente de 5 min, mantenemos pocos hits al Sheet pero
  // garantizamos datos frescos cuando el cliente realmente fetcha.
  const url = `${CONFIG.loyaltyApi}?action=getMenu&kind=${encodeURIComponent(kind)}&nocache=1&t=${Date.now()}`;
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
      console.error(`[menu-api] HTTP ${res.status} for ${kind}`);
      return null;
    }
    const text = await res.text();
    if (text.trimStart().startsWith("<")) {
      console.error("[menu-api] HTML response (Apps Script auth/deploy issue):", text.slice(0, 200));
      return null;
    }
    let json: MenuResponse;
    try {
      json = JSON.parse(text) as MenuResponse;
    } catch (parseErr) {
      console.error("[menu-api] JSON parse failed:", parseErr, "Body:", text.slice(0, 200));
      return null;
    }
    if (!json || !json.ok || !Array.isArray(json.data)) {
      console.error("[menu-api] Invalid response shape:", json);
      return null;
    }
    writeCache(kind, json.data);
    // Debug: log first item with price for quick verification
    const firstItem = json.data?.[0]?.sections?.[0]?.items?.[0];
    console.log(
      `[menu-api] ✓ Fetched ${kind} menu (${json.data.length} cats). First item: ${firstItem?.name} = $${firstItem?.price}. generatedAt=${json.generatedAt}`,
    );
    return json.data;
  } catch (err) {
    console.error("[menu-api] ✗ Fetch failed for", kind, ":", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch menu data for the given kind.
 * Returns cached data immediately if available (<5 min old) and triggers a background refresh.
 * Otherwise fetches fresh data.
 * Returns null on failure — caller should fall back to static menu-data.
 */
export async function fetchMenu(kind: MenuKind): Promise<MenuCategory[] | null> {
  const cached = readCache(kind);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    // Stale-while-revalidate: serve cache, refresh in background
    setTimeout(() => {
      void fetchAndCache(kind);
    }, 0);
    return cached.data;
  }
  return fetchAndCache(kind);
}

/**
 * Force a fresh fetch, ignoring cache.
 */
export async function refreshMenu(kind: MenuKind): Promise<MenuCategory[] | null> {
  return fetchAndCache(kind);
}

/**
 * Clears the cached menus (both kinds).
 */
export function clearMenuCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CACHE_KEY_PREFIX + "regular");
    window.localStorage.removeItem(CACHE_KEY_PREFIX + "tradicional");
  } catch {
    /* ignore */
  }
}
