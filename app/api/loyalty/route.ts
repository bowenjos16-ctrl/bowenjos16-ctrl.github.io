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
const NO_CACHE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST(req: Request) {
  const body = await req.text();

  try {
    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      redirect: "follow",
      cache: "no-store",
    });

    const text = await upstream.text();

    // Si Apps Script devolvió HTML (típicamente página de login/auth de Google),
    // lo convertimos a un error JSON manejable por el cliente en vez de
    // dejar que el cliente intente parsear HTML como JSON.
    if (text.trimStart().startsWith("<")) {
      console.error(
        "[loyalty proxy] upstream devolvió HTML:",
        upstream.status,
        text.slice(0, 300),
      );
      return NextResponse.json(
        {
          ok: false,
          error: "upstream_html",
          message:
            "Apps Script devolvió HTML (¿deploy expirado o sin permisos públicos?)",
          upstreamStatus: upstream.status,
        },
        { status: 502, headers: NO_CACHE_HEADERS },
      );
    }

    return new NextResponse(text, {
      status: upstream.ok ? 200 : upstream.status,
      headers: NO_CACHE_HEADERS,
    });
  } catch (err) {
    console.error("[loyalty proxy] fetch a Apps Script falló:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: "upstream_unreachable", message: msg },
      { status: 502, headers: NO_CACHE_HEADERS },
    );
  }
}

// Healthcheck rápido — útil para verificar el proxy sin pegarle a Apps Script
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "loyalty-proxy", upstream: APPS_SCRIPT_URL },
    { headers: NO_CACHE_HEADERS },
  );
}
