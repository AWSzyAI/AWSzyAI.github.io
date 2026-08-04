# Money / Tax 云同步配置

网页已经实现模板模式、GitHub 登录、按用户隔离和自动同步。完成以下控制台配置后即可启用。

## 1. Supabase

1. 新建 Supabase 项目。
2. 在 SQL Editor 中执行仓库根目录的 `supabase-setup.sql`。
3. 在 Project Settings → API 中复制 Project URL 与 Publishable key（旧项目可能显示 anon key）。
4. 将这两个公开值填写到 `cloud-config.js`。不要把 service_role key 写进网页。

## 2. GitHub OAuth App

1. 在 GitHub Settings → Developer settings → OAuth Apps 新建应用。
2. Homepage URL 填网站正式地址，例如 `https://awszyai.github.io/`。
3. Authorization callback URL 填 Supabase GitHub Provider 页面显示的回调地址，形式为：
   `https://<project-ref>.supabase.co/auth/v1/callback`
4. 把 GitHub Client ID 和 Client Secret 填入 Supabase Authentication → Providers → GitHub。
5. 在 Supabase Authentication → URL Configuration：
   - Site URL 填正式站点地址。
   - Redirect URLs 加入 `https://awszyai.github.io/money.html` 与 `https://awszyai.github.io/tax.html`。

GitHub Client Secret 只保存在 Supabase 控制台，不能提交到 GitHub。

## 3. 首次迁移

使用 `AWSzyAI` GitHub 账号在原浏览器首次登录时，网页会读取旧 localStorage 数据，成功写入云端后删除对应旧副本。其他账号首次登录只会得到默认模板。

## 安全边界

- 数据通过 HTTPS 传输，Supabase 数据库与备份采用静态加密。
- RLS 使用 `auth.uid() = user_id` 强制隔离用户数据。
- 网页只包含可公开的 Project URL 与 Publishable key；安全性来自 RLS，不能在前端使用 service_role key。
- 该方案不是带独立口令的端到端加密；目标是只需 GitHub 登录即可使用。
