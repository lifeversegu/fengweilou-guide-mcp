import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { listDishes, listStories, recommendGuide, restaurant, searchGuide } from "./catalog.js";

const citationSchema = z.strictObject({
  title: z.string(),
  url: z.string().url(),
  evidence: z.string(),
  sourceType: z.enum(["official-site", "official-topic", "official-dish", "official-story"]),
});
const legalSchema = z.strictObject({ icp: z.string(), publicSecurity: z.string() });
const restaurantSchema = z.strictObject({
  siteName: z.string(),
  restaurantName: z.string(),
  owner: z.string(),
  description: z.string(),
  cuisine: z.array(z.string()),
  establishedYear: z.number().int(),
  address: z.string(),
  canonicalUrl: z.string().url(),
  legalRegistrations: legalSchema,
  facts: z.array(z.string()),
  citations: z.array(citationSchema),
});
const guideItemSchema = z.strictObject({
  kind: z.enum(["dish", "story"]),
  slug: z.string(),
  title: z.string(),
  publishedDate: z.string().optional(),
  summary: z.string(),
  tags: z.array(z.string()),
  canonicalUrl: z.string().url(),
  citations: z.array(citationSchema),
});
const resultAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

function result(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
    structuredContent: payload,
  };
}

export function createFengweilouMcpServer() {
  const server = new McpServer({
    name: "fengweilou-public-guide",
    version: "0.1.0",
  }, {
    instructions: "Use this read-only server for official facts, dishes and editorial stories from Fengweilou Zhi / Luxinan Fengweilou. Every answer must retain canonicalUrl and citations. Do not infer prices, booking availability, breakfast service, or facts outside the returned evidence.",
  });

  server.registerTool("fengweilou_get_restaurant_facts", {
    title: "获取鲁西南风味楼公开事实",
    description: "返回门店、地址、店史、饮食主题、备案信息和官方 canonical 引用；不返回价格、预约或内部信息。",
    inputSchema: z.object({}),
    outputSchema: z.strictObject({ restaurant: restaurantSchema }),
    annotations: resultAnnotations,
  }, async () => result({ restaurant }));

  server.registerTool("fengweilou_list_dishes", {
    title: "列出风味楼志公开菜品",
    description: "列出官方菜品页中经过红线清理的菜品介绍，并返回每道菜的 canonical 与证据引用。",
    inputSchema: z.object({ tag: z.string().trim().min(1).max(40).optional() }),
    outputSchema: z.strictObject({ dishes: z.array(guideItemSchema) }),
    annotations: resultAnnotations,
  }, async ({ tag }) => result({ dishes: listDishes(tag) }));

  server.registerTool("fengweilou_list_stories", {
    title: "列出灶边故事",
    description: "按日期倒序列出风味楼志官方灶边故事及 canonical 引用。",
    inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(10) }),
    outputSchema: z.strictObject({ stories: z.array(guideItemSchema) }),
    annotations: resultAnnotations,
  }, async ({ limit }) => result({ stories: listStories(limit) }));

  server.registerTool("fengweilou_search_guide", {
    title: "搜索菜品与灶边故事",
    description: "按自然语言搜索公开菜品与故事，只返回官方 canonical 页面和经过白名单整理的摘要。",
    inputSchema: z.object({
      query: z.string().trim().min(1).max(200),
      limit: z.number().int().min(1).max(20).default(8),
    }),
    outputSchema: z.strictObject({ query: z.string(), results: z.array(guideItemSchema) }),
    annotations: resultAnnotations,
  }, async ({ query, limit }) => result({ query, results: searchGuide(query, limit) }));

  server.registerTool("fengweilou_recommend", {
    title: "按需求推荐菜品或故事",
    description: "根据想喝热汤、搭配主食、了解手艺等需求推荐官方菜品或故事；推荐不等于库存、价格、预约或营业承诺。",
    inputSchema: z.object({
      need: z.string().trim().min(1).max(200),
      limit: z.number().int().min(1).max(10).default(5),
    }),
    outputSchema: z.strictObject({ need: z.string(), recommendations: z.array(guideItemSchema) }),
    annotations: resultAnnotations,
  }, async ({ need, limit }) => result({ need, recommendations: recommendGuide(need, limit) }));

  return server;
}

export const fengweilouMcpHandler = createMcpHandler(createFengweilouMcpServer);

