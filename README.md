# AWSzyAI.github.io

时子延的个人主页与个人工具集合，部署在 GitHub Pages：

- 线上地址：<https://awszyai.github.io/>
- 仓库：<https://github.com/AWSzyAI/AWSzyAI.github.io>

## 当前状态

主页采用浅色、墨绿色点缀的简约设计。Money、Tax 与 Device 页面使用 GitHub OAuth 登录和 Supabase 云同步；未登录访客及新用户只能看到脱敏模板。

## 主要入口

| 页面 | 文件 | 用途 |
| --- | --- | --- |
| 主页 | `index.html` | 个人介绍、研究方向、项目和笔记入口 |
| Money | `money.html` | 资产、未来收入、预算、情景和贷款模拟 |
| Tax | `tax.html` | 年度综合所得、预缴税额和退补税测算 |
| Device | `device.html` | 设备、订阅、租赁、打卡、里程与收支记录 |
| PhD | `PhD.html` | 长期情景建模 |
| Obsidian | `obsidian/` | 知识库导出 |
| MkDocs | `MkDocs/site/` | 结构化文档站点 |
| Archive | `Archive/` | 历史项目 |

## 重要文档

- [项目完整记忆与维护手册](PROJECT_MEMORY.md)
- [Money / Tax 云同步配置与恢复](CLOUD_SETUP.md)
- [Supabase 数据库初始化脚本](supabase-setup.sql)

## 本地预览

```powershell
cd C:\Users\szy\Downloads\AWSzyAI.github.io
python -m http.server 4173
```

如果系统 Python 不在 PATH，可使用 Codex 工作区附带的 Python，或安装 Python 后重新打开终端。访问 <http://127.0.0.1:4173/>。

## 发布流程

```powershell
git diff --check
git status --short
git add <changed-files>
git commit -m "Describe the change"
git push origin main
gh run list --limit 5
```

推送 `main` 后由 GitHub Pages 自动构建。部署一般需要约 1–2 分钟。

## 安全提醒

- 不要把个人 Money/Tax/Device JSON、GitHub Client Secret、Supabase `service_role` key 提交到仓库。
- `cloud-config.js` 中的 Project URL 与 Publishable key 是公开客户端配置；真正的数据隔离由 Supabase RLS 完成。
- 修改云同步逻辑前先阅读 `PROJECT_MEMORY.md` 中的“数据事故与恢复状态”。
