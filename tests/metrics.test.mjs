import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { handleMcpHttp } from "../src/http.js";
import { AggregateMetrics, METRIC_TOOL_NAMES } from "../src/metrics.js";
import { trustedSyntheticRequest } from "../src/synthetic.js";

function mcpRequest(body, headers = {}) {
  return new Request("http://127.0.0.1:3421/api/mcp", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      host: "127.0.0.1:3421",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

test("aggregate metrics persist only fixed anonymous fields with real and synthetic traffic separated", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "fengweilou-metrics-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const fixed = new Date("2026-11-27T08:00:00.000Z");
  const metrics = new AggregateMetrics({ enabled: true, directory, now: () => fixed, flushDelayMs: 60_000 });

  await Promise.all([
    metrics.record("handshake_success"),
    metrics.record("tools_list_success"),
    ...Array.from({ length: 25 }, () => metrics.record("tool_call_success", { toolName: METRIC_TOOL_NAMES[0] })),
    ...METRIC_TOOL_NAMES.slice(1).map((toolName) => metrics.record("tool_call_success", { toolName })),
    metrics.record("tool_call_success", { synthetic: true, toolName: METRIC_TOOL_NAMES[1] }),
    metrics.record("tool_call_success", { toolName: "unknown_tool", query: "must not persist" }),
  ]);
  await metrics.flush();

  const file = join(directory, "daily.json");
  const raw = await readFile(file, "utf8");
  const stored = JSON.parse(raw);
  assert.deepEqual(Object.keys(stored), ["schemaVersion", "days"]);
  assert.deepEqual(Object.keys(stored.days["2026-11-27"]), ["real", "synthetic"]);
  assert.deepEqual(Object.keys(stored.days["2026-11-27"].real), [
    "handshake_success", "tools_list_success", "tool_call_success_total", "tools",
  ]);
  assert.deepEqual(Object.keys(stored.days["2026-11-27"].real.tools), METRIC_TOOL_NAMES);
  assert.equal(stored.days["2026-11-27"].real.handshake_success, 1);
  assert.equal(stored.days["2026-11-27"].real.tools_list_success, 1);
  assert.equal(stored.days["2026-11-27"].real.tool_call_success_total, 29);
  assert.equal(stored.days["2026-11-27"].real.tools[METRIC_TOOL_NAMES[0]], 25);
  for (const toolName of METRIC_TOOL_NAMES.slice(1)) assert.equal(stored.days["2026-11-27"].real.tools[toolName], 1);
  assert.equal(stored.days["2026-11-27"].synthetic.tool_call_success_total, 1);
  assert.equal(stored.days["2026-11-27"].synthetic.tools[METRIC_TOOL_NAMES[1]], 1);
  assert.doesNotMatch(raw, /query|need|slug|user-agent|referrer|session|ip|unknown_tool/iu);
  assert.equal((await stat(file)).mode & 0o777, 0o600);
});

test("aggregate metrics recover after restart and prune outside the retention window", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "fengweilou-metrics-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let current = new Date("2026-01-01T08:00:00.000Z");
  const first = new AggregateMetrics({ enabled: true, directory, retentionDays: 90, now: () => current, flushDelayMs: 60_000 });
  await first.record("tools_list_success");
  await first.flush();

  current = new Date("2026-04-01T08:00:00.000Z");
  const restarted = new AggregateMetrics({ enabled: true, directory, retentionDays: 90, now: () => current, flushDelayMs: 60_000 });
  await restarted.record("tools_list_success");
  await restarted.record("tools_list_success");
  await restarted.flush();

  const stored = JSON.parse(await readFile(join(directory, "daily.json"), "utf8"));
  assert.equal(stored.days["2026-01-01"], undefined);
  assert.equal(stored.days["2026-04-01"].real.tools_list_success, 2);
});

test("synthetic marker is trusted only for explicit loopback operations traffic", () => {
  assert.equal(trustedSyntheticRequest({ host: "127.0.0.1:3421", marker: "1", remoteAddress: "127.0.0.1" }), true);
  assert.equal(trustedSyntheticRequest({ host: "localhost:3421", marker: "1", remoteAddress: "::1" }), true);
  assert.equal(trustedSyntheticRequest({ host: "mcp.sdyangtang.com", marker: "1", remoteAddress: "127.0.0.1" }), false);
  assert.equal(trustedSyntheticRequest({ host: "127.0.0.1:3421", marker: "1", remoteAddress: "203.0.113.9" }), false);
  assert.equal(trustedSyntheticRequest({ host: "127.0.0.1:3421", marker: undefined, remoteAddress: "127.0.0.1" }), false);
});

test("HTTP boundary records only successful approved RPC operations", async () => {
  const events = [];
  const metrics = { record: async (event, details) => events.push({ event, ...details }) };

  await handleMcpHttp(mcpRequest({
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } },
  }), { metrics });
  await handleMcpHttp(mcpRequest({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }), { metrics });
  await handleMcpHttp(mcpRequest({
    jsonrpc: "2.0", id: 3, method: "tools/call",
    params: { name: "fengweilou_get_restaurant_facts", arguments: {} },
  }, { "x-fengweilou-synthetic": "1" }), { metrics });

  await handleMcpHttp(mcpRequest({
    jsonrpc: "2.0", id: 4, method: "tools/call",
    params: { name: "fengweilou_search_guide", arguments: { query: "" } },
  }), { metrics });
  await handleMcpHttp(mcpRequest({
    jsonrpc: "2.0", id: 5, method: "tools/call",
    params: { name: "unknown_tool", arguments: {} },
  }), { metrics });
  await handleMcpHttp(mcpRequest({ jsonrpc: "2.0", id: 6, method: "tools/list", params: {} }, { host: "attacker.example" }), { metrics });
  await handleMcpHttp(mcpRequest({ jsonrpc: "2.0", id: 7, method: "tools/list", params: {} }, { origin: "https://attacker.example" }), { metrics });

  assert.deepEqual(events, [
    { event: "handshake_success", synthetic: false, toolName: undefined },
    { event: "tools_list_success", synthetic: false, toolName: undefined },
    { event: "tool_call_success", synthetic: true, toolName: "fengweilou_get_restaurant_facts" },
  ]);
});
