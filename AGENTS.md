# AWSzyAI.github.io · Agent 入口

这是一个**公开**仓库（GitHub Pages：https://awszyai.github.io/ ）。动手前先读：

1. `PROJECT_MEMORY.md`：架构、设计决策、各页面的数据模型（Device 在第 5 节）、安全规则、验证流程。
2. `CLOUD_SETUP.md`：Supabase / GitHub 登录配置与数据恢复。

## 硬规则

- 只提交代码和脱敏示例。真实金额、账户、导出的 JSON 备份、带数据的截图一律不进 git。用户的真实收支数据只存在 Supabase 中、用户本人账号下的文档里。
- 用户的记账流程和真实数据在私有目录 `/Users/szy/Downloads/支出`（见那里的 `AGENTS.md`）。往 device 页面写数据按那份规范操作，不要写进本仓库。
- 改 device 页面的统计逻辑前，先看 `PROJECT_MEMORY.md` 第 5 节记录的用户决定，例如：摊销只针对支出、收入不摊销、车贷每月按整期月供计、补助周期从 24 日开始。
- 每次改完都要更新 `PROJECT_MEMORY.md` 里对应的小节。

## 本地测试

```bash
python3 -m http.server 4174 --directory /Users/szy/Downloads/AWSzyAI.github.io
```

在浏览器打开 `http://localhost:4174/device.html`（未登录，模板模式），用页面 JS 注入测试项目核对数字，并检查控制台没有报错。如果用户已经在内置浏览器里登录了线上页面，测试要开新标签页，别占用那个标签页。

## 推送与部署

```bash
git push origin main
```

如果报「无法读取远程仓库 / 请确认您有正确的访问权限」，通常是本机代理掐断了 SSH 22 端口。可以改用 gh 的凭据走 HTTPS 推送，不需要修改 remote：

```bash
git -c credential.helper= -c "credential.helper=!gh auth git-credential" push https://github.com/AWSzyAI/AWSzyAI.github.io.git main
```

部署检查：`gh run list --repo AWSzyAI/AWSzyAI.github.io --limit 1` 显示 success 后，用 `curl -s -H "Cache-Control: no-cache" "https://awszyai.github.io/device.html?nc=$RANDOM"` 确认新代码已经上线（CDN 可能要多等一两分钟）。在浏览器里打开时加 `?v=<提交号>` 绕过缓存。
