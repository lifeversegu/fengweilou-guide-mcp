import { fengweilouMcpHandler } from "./server.js";
import { aggregateMetrics, METRIC_TOOL_NAMES } from "./metrics.js";
import { SYNTHETIC_HEADER } from "./synthetic.js";

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

function metricCandidate(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  if (payload.method === "initialize") return { event: "handshake_success" };
  if (payload.method === "tools/list") return { event: "tools_list_success" };
  if (payload.method === "tools/call" && METRIC_TOOL_NAMES.includes(payload.params?.name)) {
    return { event: "tool_call_success", toolName: payload.params.name };
  }
  return undefined;
}

async function requestMetric(request) {
  if (request.method !== "POST") return undefined;
  try {
    return metricCandidate(await request.clone().json());
  } catch {
    return undefined;
  }
}

async function successfulRpcResponse(response) {
  if (!response.ok) return false;
  try {
    const text = await response.clone().text();
    const dataLine = text.split("\n").find((line) => line.startsWith("data: "));
    const payload = JSON.parse(dataLine ? dataLine.slice(6) : text);
    return Object.hasOwn(payload, "result") && !payload.error && !payload.result?.isError;
  } catch {
    return false;
  }
}

export async function handleMcpHttp(request, { metrics = aggregateMetrics } = {}) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/mcp") return jsonError(404, "FENGWEILOU_MCP_NOT_FOUND");
  if (!allowedHosts().has(request.headers.get("host") ?? "")) return jsonError(404, "FENGWEILOU_MCP_NOT_FOUND");
  if (!originAllowed(request)) return jsonError(403, "FENGWEILOU_MCP_ORIGIN_NOT_ALLOWED");
  if (!["GET", "POST", "DELETE"].includes(request.method)) return jsonError(405, "FENGWEILOU_MCP_METHOD_NOT_ALLOWED");

  const candidate = await requestMetric(request);
  const response = await fengweilouMcpHandler.fetch(request);
  if (candidate && await successfulRpcResponse(response)) {
    try {
      await metrics.record(candidate.event, {
        synthetic: request.headers.get(SYNTHETIC_HEADER) === "1",
        toolName: candidate.toolName,
      });
    } catch {
      console.error(JSON.stringify({ event: "metrics_record_failed", code: "AGGREGATE_WRITE_UNAVAILABLE" }));
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: secureHeaders(response.headers),
  });
}

