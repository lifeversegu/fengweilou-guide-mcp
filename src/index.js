import { createServer } from "node:http";

import { handleMcpHttp } from "./http.js";
import { aggregateMetrics } from "./metrics.js";
import { SYNTHETIC_HEADER, trustedSyntheticRequest } from "./synthetic.js";

const host = process.env.HOST?.trim() || "127.0.0.1";
const port = Number.parseInt(process.env.PORT ?? "3421", 10);
const maxBodyBytes = 256 * 1024;

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    request.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBodyBytes) {
        reject(Object.assign(new Error("REQUEST_BODY_TOO_LARGE"), { status: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function copyHeaders(headers, incoming) {
  const result = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (Array.isArray(value)) for (const item of value) result.append(name, item);
    else if (value !== undefined) result.set(name, value);
  }
  const synthetic = trustedSyntheticRequest({
    host: incoming.headers.host,
    marker: incoming.headers[SYNTHETIC_HEADER],
    remoteAddress: incoming.socket.remoteAddress,
  });
  result.delete(SYNTHETIC_HEADER);
  if (synthetic) result.set(SYNTHETIC_HEADER, "1");
  return result;
}

const server = createServer(async (incoming, outgoing) => {
  try {
    if (incoming.url === "/healthz" && incoming.method === "GET") {
      outgoing.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      outgoing.end(JSON.stringify({ ok: true, service: "fengweilou-public-guide-mcp", version: "0.1.0" }));
      return;
    }

    const body = ["GET", "HEAD"].includes(incoming.method ?? "GET") ? undefined : await readBody(incoming);
    const request = new Request(`http://${incoming.headers.host ?? `${host}:${port}`}${incoming.url ?? "/"}`, {
      method: incoming.method,
      headers: copyHeaders(incoming.headers, incoming),
      body,
    });
    const response = await handleMcpHttp(request, { metrics: aggregateMetrics });
    outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    outgoing.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    outgoing.end(JSON.stringify({ ok: false, code: status === 413 ? "REQUEST_BODY_TOO_LARGE" : "INTERNAL_ERROR" }));
  }
});

server.listen(port, host, () => {
  console.log(JSON.stringify({ event: "service_started", service: "fengweilou-public-guide-mcp", host, port }));
});

async function shutdown(signal) {
  server.close();
  try {
    await aggregateMetrics.flush();
  } finally {
    console.log(JSON.stringify({ event: "service_stopped", service: "fengweilou-public-guide-mcp", signal }));
    process.exit(0);
  }
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

