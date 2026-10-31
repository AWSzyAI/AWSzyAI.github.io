# szy-device MCP

把 [awszyai.github.io/device](https://awszyai.github.io/device) 的数据开放给 Claude Code 等 MCP 客户端，**只读**。

数据来源（`DEVICE_MCP_SOURCE`，默认 `auto`）：

1. **云端**：用本人 GitHub 账号登录后，直接读 Supabase 里 `document_type = device` 的文档，和网页看到的一致。
2. **本地备份**：没登录或云端读取失败时，退回网页「Export All」导出的 `all_assets_*.json`（`DEVICE_MCP_FILE` 指定文件，或 `DEVICE_MCP_BACKUP_DIR` 指定目录取最新一份）。`device_status` 会说明当前用的是哪一种，以及云端失败的原因。

## 工具

| 工具 | 作用 |
|---|---|
| `device_status` | 数据来源、更新时间、项目数量、账目覆盖日期 |
| `list_items` | 列出资产 / 订阅 / 租赁 / 打卡，可只看进行中的 |
| `get_item` | 按名称取一个项目的完整记录 |
| `rentals` | 租赁订单明细与汇总（默认「租车」）：日均、每公里、按年合计，自动跳过重复条目 |
| `car_loan` | 车贷月供、已还 / 剩余期数和金额、下一次还款 |
| `ledger` | 按日期和分类列出每日账目 |
| `spending_summary` | 一段日期的收支汇总，订阅 / 租赁 / 车贷按天摊销 |
| `checkins` | 打卡记录 |

口径与网页一致：记录使用期是 `[start, end)`；只有「个人 · 人民币」订阅计入收支；收入按到账日计入（见仓库 `PROJECT_MEMORY.md` 第 5 节）。

## 安装

```bash
cd mcp/device
npm install
claude mcp add --scope user szy-device -e DEVICE_MCP_BACKUP_DIR=<备份目录> -- node "$PWD/src/server.mjs"
```

## 登录（读云端需要）

1. 在 Supabase → Authentication → URL Configuration → Redirect URLs 加入 `http://localhost:53682/callback`（只需一次）。
2. 运行 `npm run login`，在打开的 GitHub 页面里由本人完成登录。
3. 会话保存在 `~/.config/szy-device-mcp/auth.json`（权限 0600），access token 过期时自动用 refresh token 续期。`npm run login -- --status` 查看状态，`npm run logout` 删除。

脚本只接收回调里的一次性 code，不经手 GitHub 密码。会话文件和任何导出的数据都不要提交进仓库。

## 测试

```bash
DEVICE_MCP_SOURCE=file DEVICE_MCP_FILE=<备份.json> npm test
```

冒烟测试会调用每个工具，只打印成功与否和结果长度，不输出真实数据。
