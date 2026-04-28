/**
 * Gallery API client — fetch cocina + galeria images from Apps Script.
 *
 * Strategy: localStorage cache 5 min, server cache 5 min, fallback to static.
 */
import { CONFIG } from "./config";

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_KEY = "cp_gallery";

export type GalleryImage = {
  type: "image";
  src: string;
  title: string;
  description?: string;
};

export type GalleryVideo = {
  type: "video";
  src: string; // YouTube ID o URL
  poster?: string;
  title: string;
  description?: string;
};

export type GalleryItem = GalleryImage | GalleryVideo;

export type GalleryPayload = {
  cocina: GalleryItem[];
  galeria: GalleryItem[];
};

type GalleryResponse = {
  ok: boolean;
  cocina: GalleryItem[];
  galeria: GalleryItem[];
  generatedAt: string;
};

type CacheEntry = {
  data: GalleryPayload;
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

function writeCache(data: GalleryPayload) {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = { data, ts: Date.now() };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}

async function fetchAndCache(): Promise<GalleryPayload | null> {
  if (!CONFIG.loyaltyApi) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  const url = `${CONFIG.loyaltyApi}?action=getGallery&nocache=1&t=${Date.now()}`;
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
      console.error(`[gallery-api] HTTP ${res.status}`);
      return null;
    }
    const text = await res.text();
    if (text.trimStart().startsWith("<")) {
      console.error("[gallery-api] HTML response");
      return null;
    }
    let json: GalleryResponse;
    try {
      json = JSON.parse(text) as GalleryResponse;
    } catch (parseErr) {
      console.error("[gallery-api] JSON parse failed:", parseErr);
      return null;
    }
    if (!json || !json.ok || !Array.isArray(json.cocina) || !Array.isArray(json.galeria)) {
      console.error("[gallery-api] Invalid shape:", json);
      return null;
    }
    const payload: GalleryPayload = { cocina: json.cocina, galeria: json.galeria };
    writeCache(payload);
    console.log(
      `[gallery-api] ✓ Fetched ${json.cocina.length} cocina items, ${json.galeria.length} galeria items.`,
    );
    return payload;
  } catch (err) {
    console.error("[gallery-api] ✗ Fetch failed:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchGallery(): Promise<GalleryPayload | null> {
  const cached = readCache();
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    setTimeout(() => {
      void fetchAndCache();
    }, 0);
    return cached.data;
  }
  return fetchAndCache();
}

export async function refreshGallery(): Promise<GalleryPayload | null> {
  return fetchAndCache();
}

export function clearGalleryCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
