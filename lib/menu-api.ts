/**
 * Menu API client — fetch menu data from Apps Script with localStorage caching.
 *
 * Strategy:
 *   - localStorage cache (TTL 1 hour, stale-while-revalidate)
 *   - Server cache 5 min (Apps Script CacheService)
 *   - Fallback: caller uses static menu-data.ts when this returns null
 */
import { CONFIG } from "./config";
import type { MenuCategory } from "./menu-data";
import type { MenuKind } from "./menu-schedule";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos (combinado con cache server 5 min: cambios visibles en ~5-10 min máx)
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
  if (!CONFIG.loyaltyApi) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const url = `${CONFIG.loyaltyApi}?action=getMenu&kind=${encodeURIComponent(kind)}`;
    const res = await fetch(url, {
      method: "GET",
      signal: ctrl.signal,
      cache: "no-store",
    });
    const text = await res.text();
    // Detect HTML response (auth page, redirect, etc.)
    if (text.trimStart().startsWith("<")) return null;
    const json = JSON.parse(text) as MenuResponse;
    if (!json || !json.ok || !Array.isArray(json.data)) return null;
    writeCache(kind, json.data);
    return json.data;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[menu-api] fetch failed:", err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch menu data for the given kind.
 * Returns cached data immediately if available (<1h old) and triggers a background refresh.
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
 * Force a fresh fetch, ignoring cache. Used by admin "refresh" button.
 */
export async function refreshMenu(kind: MenuKind): Promise<MenuCategory[] | null> {
  return fetchAndCache(kind);
}

/**
 * Clears the cached menus (both kinds). Useful for admin testing.
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
