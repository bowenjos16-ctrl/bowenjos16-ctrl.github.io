/**
 * Control de "1 juego por login" con cooldown de 10 horas.
 * Se almacena por teléfono del cliente loyalty para que sea por cuenta, no por navegador.
 */

import { CONFIG } from "./config";

const KEY = "cp-game-lock";

type LockEntry = {
  phone: string;
  gameId: string; // cuál jugó
  playedAt: number; // epoch ms
};

function readAll(): LockEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: LockEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function getLock(phone: string): LockEntry | null {
  const all = readAll();
  const cutoff = Date.now() - CONFIG.gameCooldownHours * 60 * 60 * 1000;
  // filtrar expirados
  const valid = all.filter((e) => e.playedAt > cutoff);
  if (valid.length !== all.length) writeAll(valid);
  return valid.find((e) => e.phone === phone) ?? null;
}

export function setLock(phone: string, gameId: string) {
  const all = readAll();
  const filtered = all.filter((e) => e.phone !== phone);
  filtered.push({ phone, gameId, playedAt: Date.now() });
  writeAll(filtered);
}

export function hoursUntilUnlock(phone: string): number {
  const lock = getLock(phone);
  if (!lock) return 0;
  const elapsedMs = Date.now() - lock.playedAt;
  const remainMs = CONFIG.gameCooldownHours * 60 * 60 * 1000 - elapsedMs;
  return Math.max(0, remainMs / (60 * 60 * 1000));
}

export function formatCountdown(hours: number): string {
  if (hours <= 0) return "Disponible";
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
