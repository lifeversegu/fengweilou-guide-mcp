# 风味楼志 MCP 发布与回滚手册

状态：`LOCAL_CANDIDATE_ONLY / NOT_DEPLOYED / NOT_REGISTERED`

## 1. 发布前门禁

1. 获得用户对 DNS、服务器部署、Nginx 精确路由和第三方目录发布的明确授权。
2. 创建独立 Git 仓库与远端，补充 `server.json.repository` 后运行官方 manifest 校验。
3. 在干净环境执行 `corepack pnpm install --frozen-lockfile && pnpm check`。
4. 再次核对 `https://sdyangtang.com/sitemap.xml` 与 14 道菜、故事列表；任何内容更新都只能进入白名单并通过红线测试。
5. 确认 `mcp.sdyangtang.com` 的 DNS 与 TLS 变更由域名所有者执行。

## 2. 独立运行域

- 建议低权限用户：`fengweilou-mcp`，不得加入 LifeVerse 或小雇服务组。
- release 根：`/opt/fengweilou-mcp/releases/<git-sha>`；current：`/opt/fengweilou-mcp/current`。
- 监听：`127.0.0.1:3421`，不得监听公网网卡。
- systemd：`fengweilou-mcp.service`，不要复用任何 LifeVerse/Xiaogu 单元。
- 环境文件：`/etc/fengweilou-mcp/fengweilou-mcp.env`，权限 `0640 root:fengweilou-mcp`。
- 日志：journald 标识 `fengweilou-public-guide-mcp`；如需落盘，单独使用 `/var/log/fengweilou-mcp/`。
- 匿名统计：单独使用 `/var/lib/fengweilou-mcp/metrics/`；仅聚合握手、工具发现、工具调用和 canonical 进入次数，不保存 IP、原始 User-Agent、请求正文或工具参数。
- 当前服务无需任何凭据；如未来新增密钥，必须使用 `FENGWEILOU_*` 变量和独立 secret，不得复用其他品牌。

## 3. Nginx 与公网路径计划

建议使用独立子域 `mcp.sdyangtang.com`，仅代理精确路径 `/api/mcp` 和 `/healthz`（健康检查仅限本机/运维网络）。设置无缓存、`nosniff`、请求体上限 256 KiB、连接和速率限制、流式代理关闭缓冲。不要把 `/` 泛代理到 MCP 服务，也不要改动静态主站 `/opt/sdyangtang`。

对外端点计划：`https://mcp.sdyangtang.com/api/mcp`。主站发现页可在另一次授权后新增 `https://sdyangtang.com/mcp/`，必须沿用图片 Logo 页头并完整保留两个备案号。

## 4. 真实验证

1. `GET /healthz` 仅验证服务进程，不等于 MCP 可用。
2. `initialize`、`tools/list` 应返回 5 个只读工具。
3. 分别真实调用事实、菜品、故事、搜索、推荐；检查 `structuredContent`。
4. 核对所有 URL 为 `https://sdyangtang.com/` canonical，不含查询参数、备份镜像、`/huo/` 或 `/kuaiyi/` 重复版本。
5. 恶意 Host 返回 404，恶意 Origin 返回 403；响应必须 `no-store`、`nosniff`。
6. 搜索全量响应不得出现价格、旧店名、1807、芝麻肯定表述、鱼刺酥化或本店供应早餐的承诺。
7. 主站首页、sitemap、robots、RSS、14 个 canonical 菜品页和备案页脚回读正常后，才可考虑 Registry/目录提交。

## 5. 回滚

Nginx 变更前必须保存精确备份。回滚顺序：恢复 Nginx 配置并 `nginx -t` 后 reload；`systemctl disable --now fengweilou-mcp.service`；保留 release、锁文件与脱敏日志供审计。由于服务无数据库迁移或业务写入，不需要数据回滚。DNS 回滚由域名所有者执行。

