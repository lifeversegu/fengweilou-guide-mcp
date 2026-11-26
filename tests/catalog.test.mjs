import assert from "node:assert/strict";
import test from "node:test";

import { dishes, listStories, recommendGuide, restaurant, searchGuide, stories } from "../src/catalog.js";

const forbidden = ["三义和", "1807", "元/", "早餐", "鱼刺酥", "含芝麻", "workbuddy.host"];

test("catalog exposes the official restaurant and complete legal registrations", () => {
  assert.equal(restaurant.restaurantName, "鲁西南风味楼");
  assert.equal(restaurant.canonicalUrl, "https://sdyangtang.com/");
  assert.equal(restaurant.legalRegistrations.icp, "鲁ICP备2026069569号-1");
  assert.equal(restaurant.legalRegistrations.publicSecurity, "鲁公网安备 37010202700896 号");
});

test("catalog contains 14 canonical dishes and current canonical stories", () => {
  assert.equal(dishes.length, 14);
  assert.equal(stories.length, 13);
  for (const item of [...dishes, ...stories]) {
    const url = new URL(item.canonicalUrl);
    assert.equal(url.origin, "https://sdyangtang.com");
    assert.equal(url.search, "");
    assert.doesNotMatch(url.pathname, /^\/(?:huo|kuaiyi)\//u);
    assert.ok(item.citations.length > 0);
    assert.equal(item.citations[0].url, item.canonicalUrl);
  }
});

test("public snapshot enforces content redlines", () => {
  const serialized = JSON.stringify({ restaurant, dishes, stories });
  for (const phrase of forbidden) assert.doesNotMatch(serialized, new RegExp(phrase, "u"), phrase);
  assert.match(serialized, /不使用芝麻/u);
  assert.match(serialized, /小刺仍需耐心挑食/u);
});

test("search and recommendation support natural-language needs", () => {
  assert.equal(searchGuide("想了解枣木炭烤的主食", 1)[0]?.slug, "diao-lu-shao-bing");
  assert.equal(searchGuide("爆煎鱼要怎么吃", 1)[0]?.slug, "gu-yun-he-bao-jian-yu");
  assert.ok(recommendGuide("冬天想喝一碗热汤", 3).some((item) => item.tags.includes("热汤")));
  assert.ok(recommendGuide("想看后厨手艺人的故事", 5).some((item) => item.kind === "story"));
  assert.equal(listStories(2).length, 2);
  assert.equal(listStories(1)[0].publishedDate, "2026-11-26");
});

test("search input limits fail closed", () => {
  assert.throws(() => searchGuide(" "), /FENGWEILOU_QUERY_REQUIRED/u);
  assert.throws(() => searchGuide("x".repeat(201)), /FENGWEILOU_QUERY_TOO_LONG/u);
  assert.throws(() => searchGuide("羊汤", 0), /FENGWEILOU_SEARCH_LIMIT_INVALID/u);
  assert.throws(() => listStories(0), /FENGWEILOU_STORY_LIMIT_INVALID/u);
});

