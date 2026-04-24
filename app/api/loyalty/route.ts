import { NextResponse } from "next/server";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwCtVgUP-7b2p2GiObXw7KbAVSW0l06Y5F-ymw5Gm9RTfY9GR2cwBSBqvekFNBbfU_n/exec";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy a Apps Script Web App.
 *
 * Resuelve el bucle de redirects que ocurre cuando el navegador hace POST
 * cross-origin a script.google.com: Google redirige a googleusercontent.com,
 * y al ver Sec-Fetch-Site: cross-site responde con otro 302 de vuelta,
 * causando "Failed to fetch".
 *
 * Al hacer el fetch desde el servidor (sin Sec-Fetch-Site), la respuesta
 * JSON se entrega correctamente.
 */
export async function POST(req: Request) {
  const body = await req.text();

  const upstream = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
    redirect: "follow",
  });

  const text = await upstream.text();

  return new NextResponse(text, {
    status: upstream.ok ? 200 : upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
