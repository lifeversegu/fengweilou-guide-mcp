const SITE_ORIGIN = "https://sdyangtang.com";

function citation(title, path, evidence, sourceType) {
  return Object.freeze({
    title,
    url: new URL(path, `${SITE_ORIGIN}/`).href,
    evidence,
    sourceType,
  });
}

const homeCitation = citation(
  "风味楼志首页",
  "/",
  "首页 Restaurant 结构化数据与店史栏目载明店名、经营地址、主营风味和 2003 年开业事实。",
  "official-site",
);
const soupCitation = citation(
  "一碗汤专题",
  "/soup.html",
  "专题介绍单县羊汤、敞口大锅与熬汤技艺，并提供可核对的品牌原始叙述。",
  "official-topic",
);
const houseCitation = citation(
  "千佛山下专题",
  "/house.html",
  "专题介绍历山路 150 号门店、2003 年开业及千佛山下的经营历史。",
  "official-topic",
);

export const restaurant = Object.freeze({
  siteName: "风味楼志",
  restaurantName: "鲁西南风味楼",
  owner: "儒香阁（济南）餐饮有限公司",
  description: "记录济南千佛山下鲁西南风味楼、单县羊汤、特色菜与灶边故事的官方品牌志。",
  cuisine: Object.freeze(["山东菜", "鲁西南风味", "单县羊汤"]),
  establishedYear: 2003,
  address: "山东省济南市历下区历山路 150 号（千佛山下）",
  canonicalUrl: `${SITE_ORIGIN}/`,
  legalRegistrations: Object.freeze({
    icp: "鲁ICP备2026069569号-1",
    publicSecurity: "鲁公网安备 37010202700896 号",
  }),
  facts: Object.freeze([
    "单县羊汤制作技艺于 2013 年入选山东省非物质文化遗产。",
    "单县羊汤为国家地理标志保护产品。",
    "门店于 2003 年开业，位于济南市历下区历山路 150 号。",
    "店内使用一米二敞口大铁锅熬汤。",
    "吊炉烧饼采用倒扣缸炉与枣木炭烘烤，表面为梳花且不使用芝麻。",
  ]),
  citations: Object.freeze([homeCitation, soupCitation, houseCitation]),
});

function dish(slug, title, summary, tags) {
  const url = `${SITE_ORIGIN}/dishes/${slug}.html`;
  return Object.freeze({
    kind: "dish",
    slug,
    title,
    summary,
    tags: Object.freeze(tags),
    canonicalUrl: url,
    citations: Object.freeze([citation(
      `${title} · 官方菜品页`,
      `/dishes/${slug}.html`,
      `官方菜品页提供“${title}”的做法、风味和门店叙述。`,
      "official-dish",
    )]),
  });
}

export const dishes = Object.freeze([
  dish("bai-nian-yang-tang", "百年羊汤", "以选羊、泡血水、砸骨、攻汤、撇沫和冲碗等工序呈现单县羊汤的传统技艺。", ["羊汤", "非遗", "招牌", "热汤"]),
  dish("diao-lu-shao-bing", "吊炉烧饼", "倒扣缸炉贴饼，以枣木炭烘烤，外壳酥脆、带麦香和炭香；表面梳花，不使用芝麻。", ["主食", "烧饼", "枣木炭", "无芝麻"]),
  dish("feng-wei-yang-pai", "风味羊排", "先煮后炸再烧，突出外焦里嫩的鲁西南风味。", ["羊肉", "硬菜", "外焦里嫩"]),
  dish("gu-yun-he-bao-jian-yu", "古运河爆煎鱼", "先爆后煎，皮酥肉紧；鲫鱼小刺仍需耐心挑食。", ["鱼", "鲁西南", "先爆后煎"]),
  dish("hong-tang-yang-rou-tang", "红汤羊肉汤", "以羊油和本地辣椒炼成红油，冲入滚汤，呈现香浓但不以辛辣为主的家常风味。", ["羊汤", "红汤", "家常", "暖胃"]),
  dish("ji-dan-suan", "鸡蛋蒜", "新蒜加盐捣出蒜浆，与煮鸡蛋和香油拌成鲁西南常见凉菜。", ["凉菜", "蒜", "鸡蛋", "家常"]),
  dish("la-chao-yang-du", "辣炒羊肚", "羊肚可猛火快炒，也可焯水冰镇后凉拌，重点在脆嫩口感。", ["羊肚", "辣炒", "凉拌", "脆嫩"]),
  dish("liang-ban-yang-lian", "凉拌羊脸", "羊脸切薄片可凉拌，也可辣炒，分别呈现脆韧与酱香滚烫的口感。", ["羊脸", "凉拌", "辣炒"]),
  dish("lu-xi-nan-da-yang-tou", "鲁西南大羊头", "拆骨食肉、搭配椒盐的一桌硬菜，体现鲁西南待客风味。", ["羊头", "硬菜", "鲁西南"]),
  dish("ban-san-si", "成武酱大头拌三丝", "以成武酱大头制成，口感脆嫩、清新解腻，适合搭配吊炉烧饼。", ["凉菜", "非遗", "成武", "搭配烧饼"]),
  dish("yang-du-tang", "羊肚汤", "脆嫩羊肚配浓白热汤，延续单县羊汤的汤底技艺。", ["羊汤", "羊肚", "热汤"]),
  dish("yang-qin-xi", "羊芹细", "羊肉配本地芹菜大火快炒，以芹菜的脆和羊肉的嫩相互衬托。", ["羊肉", "芹菜", "快炒"]),
  dish("yang-you-bing", "羊油饼", "羊油起酥、层层起纹，现烙现吃；为单县县级非物质文化遗产面点。", ["面点", "非遗", "现烙"]),
  dish("yang-za-tang", "羊杂汤", "肝、肚、肺、肠等羊杂配浓白汤底，突出不膻不腥的处理功夫。", ["羊汤", "羊杂", "热汤"]),
]);

function story(date, title, summary, tags) {
  const slug = date;
  return Object.freeze({
    kind: "story",
    slug,
    title,
    publishedDate: date,
    summary,
    tags: Object.freeze(tags),
    canonicalUrl: `${SITE_ORIGIN}/wen/${date}.html`,
    citations: Object.freeze([citation(
      `${title} · 灶边故事`,
      `/wen/${date}.html`,
      `“灶边故事”官方原文记录人物、手艺和门店日常。`,
      "official-story",
    )]),
  });
}

export const stories = Object.freeze([
  story("2026-11-04", "单县人的一天，从烫嘴开始", "讲述单县人与羊汤的日常习惯，以及一锅汤延续多年的脾气。", ["羊汤", "单县", "日常"]),
  story("2026-11-05", "手伸进炉子的人", "记录吊炉烧饼做胚、砍花、贴饼和守炉的手上功夫。", ["吊炉烧饼", "手艺", "炉火"]),
  story("2026-11-06", "挑刺的人", "从老客耐心挑鱼刺的细节，写爆煎鱼这道不能着急的菜。", ["爆煎鱼", "老客", "耐心"]),
  story("2026-11-07", "剥蒜的人", "记录新蒜、凉透的鸡蛋和慢慢捣蒜的灶边工序。", ["鸡蛋蒜", "手工", "后厨"]),
  story("2026-11-08", "数包子的人", "从孩子数锅里包子的日常，写灶边传承和细心。", ["水煎包", "孩子", "灶边"]),
  story("2026-11-09", "多一勺红油", "以一碗白汤上的红油和夜班食客，记录深夜的一顿热汤。", ["红油", "羊汤", "夜班"]),
  story("2026-11-10", "只炒一份", "记录辣炒羊肚对锅量、火候和出锅速度的严格要求。", ["羊肚", "火候", "后厨"]),
  story("2026-11-11", "看火的人", "写熬汤从前一日下骨到次日开锅之间，靠人持续守火的经验。", ["熬汤", "守火", "师徒"]),
  story("2026-11-12", "等饼的人", "写羊油饼现烙现吃，以及手艺人对出锅时机的坚持。", ["羊油饼", "现烙", "手艺"]),
  story("2026-11-13", "一张脸", "记录手切羊脸绕筋落刀的经验，以及一只羊仅有一张脸的珍贵。", ["羊脸", "刀工", "手艺"]),
  story("2026-11-24", "一碟三年", "写成武酱大头经历长时间酱制与多道工序后成为拌三丝。", ["拌三丝", "成武", "时间"]),
  story("2026-11-25", "添汤", "记录门店从单县带来的添汤习惯，以及二十三年未变的待客方式。", ["羊汤", "待客", "老规矩"]),
  story("2026-11-26", "掰成八块", "从一张烧饼如何掰开、何时入汤，写食客与手艺人的吃法经验。", ["吊炉烧饼", "吃法", "羊汤"]),
]);

function normalize(value) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("zh-CN").replace(/\s+/gu, " ");
}

function terms(query) {
  const normalized = normalize(query);
  if (!normalized) throw new Error("FENGWEILOU_QUERY_REQUIRED");
  if (normalized.length > 200) throw new Error("FENGWEILOU_QUERY_TOO_LONG");
  const result = new Set(normalized.split(" ").filter(Boolean));
  for (const run of normalized.match(/\p{Script=Han}+/gu) ?? []) {
    for (let index = 0; index < run.length - 1; index += 1) result.add(run.slice(index, index + 2));
  }
  for (const token of normalized.match(/[a-z0-9]+/gu) ?? []) result.add(token);
  return [...result];
}

function searchFields(item) {
  return [item.title, item.summary, ...item.tags].map(normalize);
}

export function listDishes(tag) {
  if (!tag) return [...dishes];
  const wanted = normalize(tag);
  return dishes.filter((item) => item.tags.some((value) => normalize(value).includes(wanted)));
}

export function listStories(limit = 10) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error("FENGWEILOU_STORY_LIMIT_INVALID");
  return [...stories].sort((left, right) => right.publishedDate.localeCompare(left.publishedDate)).slice(0, limit);
}

export function searchGuide(query, limit = 8) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error("FENGWEILOU_SEARCH_LIMIT_INVALID");
  const queryTerms = terms(query);
  return [...dishes, ...stories]
    .map((item, index) => {
      const fields = searchFields(item);
      let score = 0;
      for (const term of queryTerms) {
        if (normalize(item.title) === term) score += 20;
        if (normalize(item.title).includes(term)) score += 10;
        score += fields.slice(1).filter((field) => field.includes(term)).length * 3;
      }
      return { item, index, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map(({ item }) => item);
}

export function recommendGuide(need, limit = 5) {
  const aliases = [
    [/热|暖|汤|冬|招牌/u, "羊汤 热汤 招牌"],
    [/饼|主食|面点|配汤/u, "吊炉烧饼 羊油饼 面点"],
    [/凉菜|清爽|解腻/u, "凉菜 拌三丝 鸡蛋蒜"],
    [/手艺|故事|人物|后厨/u, "手艺 后厨 灶边"],
    [/鱼/u, "爆煎鱼 鱼"],
  ];
  let expanded = need;
  for (const [pattern, extra] of aliases) if (pattern.test(need)) expanded += ` ${extra}`;
  return searchGuide(expanded, limit);
}

