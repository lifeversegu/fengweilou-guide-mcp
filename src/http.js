import { fengweilouMcpHandler } from "./server.js";

const DEFAULT_ALLOWED_HOSTS = ["mcp.sdyangtang.com", "127.0.0.1:3421", "localhost:3421"];

function secureHeaders(source) {
  const headers = new Headers(source);
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.append("Vary", "Host");
  headers.append("Vary", "Origin");
  return headers;
}

function jsonError(status, code) {
  return new Response(JSON.stringify({ ok: false, code }), {
    status,
    headers: secureHeaders({ "Content-Type": "application/json; charset=utf-8" }),
  });
}

function allowedHosts() {
  const configured = process.env.FENGWEILOU_ALLOWED_HOSTS?.split(",").map((value) => value.trim()).filter(Boolean);
  return new Set(configured?.length ? configured : DEFAULT_ALLOWED_HOSTS);
}

function originAllowed(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const expected = process.env.FENGWEILOU_PUBLIC_ORIGIN?.trim() || "https://mcp.sdyangtang.com";
  try {
    return new URL(origin).origin === new URL(expected).origin;
  } catch {
    return false;
  }
}

export async function handleMcpHttp(request) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/mcp") return jsonError(404, "FENGWEILOU_MCP_NOT_FOUND");
  if (!allowedHosts().has(request.headers.get("host") ?? "")) return jsonError(404, "FENGWEILOU_MCP_NOT_FOUND");
  if (!originAllowed(request)) return jsonError(403, "FENGWEILOU_MCP_ORIGIN_NOT_ALLOWED");
  if (!["GET", "POST", "DELETE"].includes(request.method)) return jsonError(405, "FENGWEILOU_MCP_METHOD_NOT_ALLOWED");

  const response = await fengweilouMcpHandler.fetch(request);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: secureHeaders(response.headers),
  });
}

