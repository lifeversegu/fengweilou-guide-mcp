# 风味楼志公开只读 MCP（本地候选）

这是 `sdyangtang.com` 的独立 MCP 候选，用于让支持 MCP 的 AI 获取鲁西南风味楼的公开事实、菜品和灶边故事。当前未部署、未发布目录、未修改主站。

## 工具

- `fengweilou_get_restaurant_facts`：门店、地址、店史、饮食主题与备案信息。
- `fengweilou_list_dishes`：14 道公开菜品，可按标签筛选。
- `fengweilou_list_stories`：按日期倒序返回灶边故事。
- `fengweilou_search_guide`：自然语言搜索菜品和故事。
- `fengweilou_recommend`：按热汤、面点、凉菜、手艺等需求推荐。

所有工具均为只读、幂等、非破坏性，并返回官方 canonical URL 和来源证据。目录是经过红线清理的白名单快照，不会整页抓取并透传价格、错误服务承诺或内部页面。

## 本机运行

```bash
corepack pnpm install --frozen-lockfile
pnpm check
HOST=127.0.0.1 PORT=3421 FENGWEILOU_ALLOWED_HOSTS=127.0.0.1:3421 pnpm start
```

协议端点为 `http://127.0.0.1:3421/api/mcp`，健康检查为 `http://127.0.0.1:3421/healthz`。

## 隔离边界

- 独立 Registry 名称：`com.sdyangtang/fengweilou-guide`。
- 计划公网端点：`https://mcp.sdyangtang.com/api/mcp`（尚未创建 DNS 或部署）。
- 计划独立 systemd 单元、回环端口 `3421`、低权限用户、日志目录与统计目录。
- 无账号、无密钥、无数据库、无价格/预约/支付/订单写入。
- 不读取 LifeVerse 或小雇配置、代码、数据库、日志与统计。

详细发布门禁见 [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md)。

