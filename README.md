# 单县羊汤 · 济南美食指南 MCP

[![Official MCP Registry](https://img.shields.io/badge/MCP%20Registry-active-0b8f55)](https://registry.modelcontextprotocol.io/v0.1/servers/com.sdyangtang%2Ffengweilou-guide/versions/latest)
[![Glama](https://glama.ai/mcp/connectors/com.sdyangtang/fengweilou-guide/badges/score.svg)](https://glama.ai/mcp/connectors/com.sdyangtang/fengweilou-guide)
[![Remote MCP health](https://github.com/lifeversegu/fengweilou-guide-mcp/actions/workflows/remote-health.yml/badge.svg)](https://github.com/lifeversegu/fengweilou-guide-mcp/actions/workflows/remote-health.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

这是 `sdyangtang.com` 的独立公开 MCP，用于让支持 MCP 的 AI 获取鲁西南风味楼的公开事实、菜品和灶边故事。

- 官方网站：<https://sdyangtang.com/>
- 公网 MCP：<https://mcp.sdyangtang.com/api/mcp>
- 发现清单：<https://sdyangtang.com/.well-known/mcp/server.json>
- `llms.txt`：<https://sdyangtang.com/llms.txt>
- 传输：Streamable HTTP
- 鉴权：无；全部工具只读

## 工具

- `fengweilou_get_restaurant_facts`：门店、地址、店史、饮食主题与备案信息。
- `fengweilou_list_dishes`：14 道公开菜品，可按标签筛选。
- `fengweilou_list_stories`：按日期倒序返回灶边故事。
- `fengweilou_search_guide`：自然语言搜索菜品和故事。
- `fengweilou_recommend`：按热汤、面点、凉菜、手艺等需求推荐。

所有工具均为只读、幂等、非破坏性，并返回官方 canonical URL 和来源证据。目录是经过红线清理的白名单快照，不会整页抓取并透传价格、错误服务承诺或内部页面。

## 连接

在支持远程 Streamable HTTP MCP 的客户端中添加：

```text
https://mcp.sdyangtang.com/api/mcp
```

无需 API Key、登录或其他请求头。本服务不会执行预约、支付、下单或数据写入。

## 隐私安全统计

服务只按上海时区逐日汇总成功的 MCP 初始化、工具发现和五个白名单工具调用次数，并将运维合成测试与真实访问分开。统计不会保存 IP、User-Agent、Referrer、请求正文、工具参数或 session，默认只保留 90 天。MCP 协议本身不能可靠证明用户随后访问了哪个网页，因此不会把无法验证的“最终进站人数”伪装成精确转化数据。

## 本机开发

```bash
corepack pnpm install --frozen-lockfile
pnpm check
HOST=127.0.0.1 PORT=3421 FENGWEILOU_ALLOWED_HOSTS=127.0.0.1:3421 pnpm start
```

本机协议端点为 `http://127.0.0.1:3421/api/mcp`，健康检查为 `http://127.0.0.1:3421/healthz`。

## 隔离边界

- 独立 Registry 名称：`com.sdyangtang/fengweilou-guide`。
- 公网端点：`https://mcp.sdyangtang.com/api/mcp`。
- 使用独立 systemd 单元、回环端口 `3421`、低权限用户和 release 目录。
- 无账号、无密钥、无数据库、无价格/预约/支付/订单写入。
- 不读取 LifeVerse 或小雇配置、代码、数据库、日志与统计。

详细发布、验证与回滚边界见 [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md)。

## 许可证与安全

代码与公开文档按 [MIT License](./LICENSE) 提供。安全问题请按
[SECURITY.md](./SECURITY.md) 通过 GitHub 私密漏洞报告渠道提交；不要在公开 Issue 中披露漏洞细节。

