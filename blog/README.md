# 博客GitHub OAuth认证系统

这个系统为博客添加了GitHub OAuth登录功能，支持区分作者和访客权限。

## 功能特性

- ✅ GitHub OAuth登录（支持真实和模拟两种模式）
- ✅ 用户权限管理（作者/访客）
- ✅ 评论、点赞、划线功能
- ✅ 本地存储用户信息
- ✅ 响应式设计，支持移动端
- ✅ 配置界面友好

## 文件结构

```
blog/
├── auth.js                    # 主要认证逻辑
├── github-oauth-config.js     # GitHub OAuth配置
├── auth-callback.html         # OAuth回调处理页面
├── test-auth.html            # 测试页面
├── admin.html                # 博客管理页面
├── post.html                 # 博客文章页面
├── edit.html                 # 博客编辑页面
├── comments.js               # 评论系统
└── README.md                 # 说明文档
```

## 配置步骤

### 1. 创建GitHub OAuth应用

1. 访问 [GitHub Developer Settings](https://github.com/settings/applications/new)
2. 填写应用信息：
   - **Application name**: 你的博客名称
   - **Homepage URL**: `https://awszyai.github.io`
   - **Authorization callback URL**: `https://awszyai.github.io/blog/auth-callback.html`

### 2. 获取Client ID

创建应用后，复制Client ID（类似：`ghp_xxxxxxxxxxxxxxxxxxxx`）

### 3. 配置系统

有两种配置方式：

#### 方式1：使用测试页面
1. 访问 `https://awszyai.github.io/blog/test-auth.html`
2. 点击"配置GitHub OAuth"按钮
3. 输入你的Client ID并保存

#### 方式2：直接编辑配置文件
编辑 `github-oauth-config.js` 文件，将 `GITHUB_CLIENT_ID_PLACEHOLDER` 替换为真实的Client ID：

```javascript
const GITHUB_OAUTH_CONFIG = {
    CLIENT_ID: '你的实际Client_ID',
    // ... 其他配置
};
```

## 使用方法

### 登录流程

1. 点击"GitHub登录"按钮
2. 跳转到GitHub授权页面
3. 授权后自动跳转回博客
4. 系统自动获取用户信息并保存

### 权限说明

- **作者权限**（用户名为 `AWSzyAI`）：
  - ✅ 发布文章
  - ✅ 编辑文章
  - ✅ 删除文章
  - ✅ 评论
  - ✅ 点赞
  - ✅ 划线

- **访客权限**：
  - ✅ 评论
  - ✅ 点赞
  - ✅ 划线
  - ❌ 发布文章

## 技术限制说明

由于GitHub Pages只支持静态网站，这个OAuth实现有以下限制：

1. **令牌交换**：使用模拟令牌，真实的令牌交换需要后端服务
2. **Client Secret**：不能在前端使用，需要后端安全存储
3. **用户信息**：优先使用GitHub API，失败时使用模拟数据

如需完整的OAuth功能，建议配合以下服务：
- GitHub Actions
- Vercel/Netlify Functions
- AWS Lambda
- Firebase Functions

## 测试

访问测试页面进行功能测试：
`https://awszyai.github.io/blog/test-auth.html`

测试内容包括：
- 配置状态检查
- 登录功能测试
- 权限验证
- 调试信息查看

## 故障排除

### 常见问题

1. **"请先配置GitHub Client ID"错误**
   - 解决：按照配置步骤设置正确的Client ID

2. **OAuth回调失败**
   - 检查GitHub应用中的回调URL是否正确
   - 确保URL格式：`https://awszyai.github.io/blog/auth-callback.html`

3. **用户信息获取失败**
   - 查看浏览器控制台的错误信息
   - 检查网络连接和GitHub API状态

### 调试方法

1. 打开浏览器开发者工具
2. 查看Console面板的日志信息
3. 使用测试页面查看详细的调试信息

## 安全注意事项

1. **Client ID** 可以安全地暴露在前端
2. **Client Secret** 绝不能出现在前端代码中
3. 用户令牌应存储在安全的位置
4. 建议定期检查和更新OAuth配置

## 更新日志

- v1.0.0: 初始版本，支持基本的GitHub OAuth登录
- v1.1.0: 添加配置界面和测试页面
- v1.2.0: 优化移动端支持和错误处理