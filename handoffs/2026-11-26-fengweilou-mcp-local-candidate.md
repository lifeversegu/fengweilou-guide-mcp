# 风味楼志公开只读 MCP 本地候选交接

状态：`LOCAL_CANDIDATE_COMPLETE / NOT_DEPLOYED / USER_RELEASE_AUTH_REQUIRED`

## 已完成

- 建立独立仓库、独立命名空间 `com.sdyangtang/fengweilou-guide` 与计划端点 `https://mcp.sdyangtang.com/api/mcp`。
- 建立 5 个只读工具：门店事实、14 道菜、灶边故事、搜索、推荐。
- 所有结果返回 canonical 与官方来源证据；不返回视觉重复页、备份镜像或跟踪参数。
- 白名单清理了线上旧 meta 中的价格等内容，并锁定内容红线与备案信息。
- 加入 Host/Origin、安全响应头、请求体上限和回环监听默认值。
- 完成独立部署、日志、统计、凭据与回滚边界说明。

## 未完成（需要新授权）

- 未创建 DNS、TLS、服务器 release、systemd 或 Nginx 配置。
- 未修改 `sdyangtang.com` 静态站，也未新增主站 MCP 发现页。
- 未创建远端 Git 仓库，未向 MCP Registry 或任何第三方目录提交。
- 未建立真实公网统计；候选只定义隐私安全的独立统计边界。

## 唯一发布入口

按根目录 `DEPLOYMENT_RUNBOOK.md` 从干净 release 发布；禁止从 LifeVerse/Xiaogu release 继承或共用运行配置。

