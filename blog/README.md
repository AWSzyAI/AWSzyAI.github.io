# 博客系统状态

旧版博客系统基于浏览器端 GitHub OAuth 模拟登录、`localStorage` 文章存储和前端管理页面。该实现无法安全地区分作者与访客，已停用。

## 当前行为

- `auth.js` 是失败关闭的边界层：不提供登录、不授予作者权限，用户身份相关方法一律返回空或拒绝。
- `auth-callback.html` 会显示登录失败，不再创建会话。
- 旧的 `admin.html`、`edit.html` 前端编辑器与后台已删除：它们依赖不完整的表单和前端作者权限，无法安全保存文章。
- 文章的 Markdown 渲染统一经过 `security.js` 的白名单过滤；评论、标签、标题等动态字段做 HTML 转义。
- `post.html`、`comments.js` 中不安全的 `innerHTML` 注入点已改为转义或白名单输出。

## 文件结构

```
blog/
├── auth.js             # 失败关闭的认证边界
├── security.js         # escapeHtml / sanitizeHtml 白名单过滤
├── auth-callback.html  # 停用后的回调提示页
├── index.html          # 预留的 Digital Garden 入口
├── post.html           # 文章阅读页
├── comments.js         # 评论渲染（仅本地、已转义）
└── README.md
```

## 恢复真实认证的前提

在静态站点上无法安全保存 Client Secret，也无法完成授权码交换。要恢复登录与作者权限，必须：

1. 增加服务端组件（如 Vercel/Netlify Functions、GitHub Actions 或独立后端）完成 OAuth 授权码交换。
2. 由服务端签发会话，并重新验证 GitHub 用户是否为作者。
3. 前端只把会话结果用于界面展示，所有写操作在服务端再次鉴权。
4. 不要将 access token 写入 `localStorage`。

当前写作入口以 `/blog.html` 与 `/obsidian/` 为准。
