import assert from "node:assert/strict";
import test from "node:test";

import { handleMcpHttp } from "../src/http.js";

function request(body, headers = {}) {
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

async function rpc(response) {
  const text = await response.text();
  if (!response.headers.get("content-type")?.includes("text/event-stream")) return JSON.parse(text);
  const line = text.split("\n").find((value) => value.startsWith("data: "));
  assert.ok(line, text);
  return JSON.parse(line.slice(6));
}

async function callTool(name, args, id = 1) {
  const response = await handleMcpHttp(request({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } }));
  return { response, message: await rpc(response) };
}

test("MCP advertises exactly five read-only tools with strict outputs", async () => {
  const response = await handleMcpHttp(request({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }));
  const message = await rpc(response);
  assert.deepEqual(message.result.tools.map((tool) => tool.name), [
    "fengweilou_get_restaurant_facts",
    "fengweilou_list_dishes",
    "fengweilou_list_stories",
    "fengweilou_search_guide",
    "fengweilou_recommend",
  ]);
  for (const tool of message.result.tools) {
    assert.deepEqual(tool.annotations, {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
    assert.equal(tool.outputSchema.additionalProperties, false);
  }
});

test("all five tools return canonical citations and redline-safe content", async () => {
  const facts = await callTool("fengweilou_get_restaurant_facts", {});
  assert.equal(facts.message.result.structuredContent.restaurant.establishedYear, 2003);

  const dishesResult = await callTool("fengweilou_list_dishes", { tag: "烧饼" }, 2);
  assert.ok(dishesResult.message.result.structuredContent.dishes.length >= 1);

  const storiesResult = await callTool("fengweilou_list_stories", { limit: 2 }, 3);
  assert.equal(storiesResult.message.result.structuredContent.stories.length, 2);

  const search = await callTool("fengweilou_search_guide", { query: "枣木炭主食", limit: 1 }, 4);
  assert.equal(search.message.result.structuredContent.results[0].slug, "diao-lu-shao-bing");

  const recommend = await callTool("fengweilou_recommend", { need: "冬天想喝热汤", limit: 3 }, 5);
  assert.ok(recommend.message.result.structuredContent.recommendations.length > 0);

  const serialized = JSON.stringify([facts.message, dishesResult.message, storiesResult.message, search.message, recommend.message]);
  for (const phrase of ["三义和", "1807", "元/", "早餐", "workbuddy.host"]) assert.doesNotMatch(serialized, new RegExp(phrase, "u"));
});

test("HTTP boundary rejects unknown Host and cross-origin browsers", async () => {
  const unknown = await handleMcpHttp(request({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }, { host: "attacker.example" }));
  assert.equal(unknown.status, 404);

  const crossOrigin = await handleMcpHttp(request({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, { origin: "https://attacker.example" }));
  assert.equal(crossOrigin.status, 403);

  const sameOrigin = await handleMcpHttp(request({ jsonrpc: "2.0", id: 3, method: "tools/list", params: {} }, { origin: "https://mcp.sdyangtang.com" }));
  assert.equal(sameOrigin.status, 200);
  assert.equal(sameOrigin.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(sameOrigin.headers.get("x-content-type-options"), "nosniff");
});

test("HTTP boundary rejects non-MCP paths and methods", async () => {
  const path = await handleMcpHttp(new Request("http://127.0.0.1:3421/not-mcp", { headers: { host: "127.0.0.1:3421" } }));
  assert.equal(path.status, 404);
  const method = await handleMcpHttp(new Request("http://127.0.0.1:3421/api/mcp", { method: "PUT", headers: { host: "127.0.0.1:3421" } }));
  assert.equal(method.status, 405);
});

