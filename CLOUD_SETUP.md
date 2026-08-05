# Money / Tax / Device 云同步、备份与恢复

最后更新：2026-08-05

## 当前线上配置

- 正式站点：`https://awszyai.github.io/`
- Supabase Project URL 和 Publishable key：见 `cloud-config.js`
- 所有者 GitHub 登录名：`AWSzyAI`
- GitHub OAuth callback：Supabase 项目的 `/auth/v1/callback`

Publishable key 本来就会发送给浏览器，可以公开。GitHub Client Secret 与 Supabase `service_role` key 绝不能写入仓库或网页。

## Supabase 初始化

在 Supabase SQL Editor 执行 `supabase-setup.sql`。脚本会：

1. 创建 `public.user_documents`。
2. 启用 RLS。
3. 撤销匿名角色权限。
4. 只允许 authenticated 用户操作自己的行。
5. 为 Money、Tax 和 Device 各保存一份 JSON payload。

脚本可重复执行，策略会先删除再重建。

## GitHub OAuth 配置

GitHub OAuth App：

- Homepage URL：`https://awszyai.github.io/`
- Authorization callback URL：`https://<project-ref>.supabase.co/auth/v1/callback`

Supabase Authentication → Providers → GitHub：

- 填 GitHub Client ID。
- 填 GitHub Client Secret。

Supabase Authentication → URL Configuration：

- Site URL：`https://awszyai.github.io/`
- Redirect URLs 至少包含：
  - `https://awszyai.github.io/money.html`
  - `https://awszyai.github.io/money`
  - `https://awszyai.github.io/tax.html`
  - `https://awszyai.github.io/tax`
  - `https://awszyai.github.io/device.html`
  - `https://awszyai.github.io/device`

页面当前使用 `location.origin + location.pathname` 作为 `redirectTo`，所以带扩展名和无扩展名的入口最好都加入允许列表。

## 正常使用流程

1. 打开 Money、Tax 或 Device。
2. 点击右下角“GitHub 登录”。
3. 在 GitHub 页面输入 GitHub 用户名/邮箱和密码，完成授权。
4. 返回页面后确认右下角显示 `<GitHub 用户名> · 已同步`。
5. Money、Tax 与 Device 是三个独立文档，三页都要至少打开一次。

登录密码只输入 GitHub 官方页面。任何维护者都不应索取密码、验证码或 Client Secret。

## 数据隔离验证

### 未登录

- 页面显示“模板模式”。
- Money/Tax/Device 只展示脱敏示例。
- 修改后刷新不应保留财务数据。
- 对 `user_documents` 的匿名 REST 读取应得到 401/permission denied。

### 已登录

- 查询自动受 RLS 限制为 `auth.uid() = user_id`。
- 每个用户只能读写自己的 `(user_id, document_type)`。
- 不同 GitHub 账号不会共享数据。

## 备份

Tax 页面支持“导出 JSON”。做重大修改、迁移或恢复前必须导出。

建议：

1. 文件名包含日期，例如 `tax-private-backup-2026-08-05.json`。
2. 放在私人加密磁盘或密码管理器附件中。
3. 不放在当前公开仓库、GitHub Issue、聊天截图或公开云盘。
4. 至少保留一份近期可用备份。

Money 当前有 JSON Load/Sync 流程。改动 Money 数据结构前，也应先导出或复制原始 JSON；如果界面没有清楚的导出入口，应优先补齐该功能。

Device 页面支持全量导入/导出。真实源文件当前位于：

```text
C:\Users\szy\iCloudDrive\PhD\all_assets_2026-07-02_13_38_22.json
```

导入前必须先执行更新后的 `supabase-setup.sql`，否则旧数据库约束只允许 `money` 和 `tax`，Device 保存会失败。

Device 恢复步骤：登录 `AWSzyAI` → 确认右下角已同步 → 点击“加载全部”并选择源 JSON → 等待已同步 → 刷新核对 → 再导出一份新的私人备份。源 JSON 不得提交到 Git。

## 恢复 Tax 数据

当前本机一次性恢复文件：

```text
C:\Users\szy\AppData\Local\Temp\szy-tax-recovery-2026-2027.json
```

恢复步骤：

1. 确认右下角已经显示 `AWSzyAI · 已同步`。
2. 点击 Tax 页顶部“导入”。
3. 选择恢复 JSON。
4. 核对年份列表、收入笔数、已发生/预计状态、扣除和汇总。
5. 等待右下角再次显示“已同步”。
6. 刷新页面，确认数据仍在。
7. 点击“导出 JSON”生成新的私人备份。
8. 确认备份可用后删除临时恢复文件。

警告：导入会用文件中的整个年度账本替换当前 Tax 云端文档。导入前先导出当前云端内容作为回滚备份。

## 为什么自动迁移可能失败

`cloud-sync.js` 当前逻辑是：

1. 如果远端有 payload，直接使用远端。
2. 只有远端没有行时，所有者账号才读取旧 localStorage。
3. 写入成功后删除旧 localStorage。

因此，如果远端已经误写入模板，旧 localStorage 不会自动覆盖它。Money 当前又使用新的脱敏 storage key，所以不能依赖自动迁移找回旧 Money 数据。

后续应改成显式迁移：检测到本机旧数据与云端模板冲突时，让用户选择“导入本机数据”“保留云端数据”或“先导出双方备份”，不要静默决定。

## 故障排查

### 点击登录后仍是模板

1. 检查右下角是否显示用户名。
2. 检查 Supabase Redirect URLs 是否包含当前 pathname。
3. 在 GitHub OAuth App 检查 callback 是否为 Supabase callback，而不是 GitHub Pages 地址。
4. 检查 `cloud-config.js` 是否已部署。
5. 查看 Supabase Authentication → Users 中是否出现 GitHub 用户。

### 显示已同步但数据是模板

说明该用户的远端行很可能已经保存了模板。不要继续手填；先导出/恢复 JSON，再通过“导入”覆盖该用户的 Tax 文档。

### 显示同步失败

检查：

- `supabase-setup.sql` 是否已执行。
- 表名是否为 `public.user_documents`。
- RLS 策略是否存在。
- authenticated 是否拥有 select/insert/update/delete。
- 浏览器会话是否过期，可退出后重新登录。

### OAuth redirect 不允许

把报错页面中的完整返回地址加入 Supabase Redirect URLs。注意 `/tax` 与 `/tax.html`、`/money` 与 `/money.html` 是不同 pathname。

## 修改云同步时的最低测试

1. 匿名访问只能看到模板。
2. 匿名 REST 读取被拒绝。
3. 所有者登录后可以保存、刷新并恢复。
4. 第二账号只能看到自己的模板/数据。
5. Money、Tax 与 Device 互不覆盖。
6. 登出后立即恢复模板显示。
7. 网络失败时显示错误，不删除本地旧数据。
