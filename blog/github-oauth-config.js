/**
 * GitHub OAuth 配置文件
 *
 * 重要安全提示：
 * 1. Client ID 可以安全地暴露在前端代码中
 * 2. Client Secret 绝不能暴露在前端代码中
 * 3. 在生产环境中，你需要一个后端服务来处理OAuth令牌交换
 */

const GITHUB_OAUTH_CONFIG = {
    // GitHub OAuth 应用的 Client ID
    CLIENT_ID: 'Ov23limikvCFVpfwCOU3',

    // OAuth 回调 URL（必须与GitHub应用中设置的完全一致）
    REDIRECT_URI: 'https://awszyai.github.io/blog/auth-callback.html',

    // 请求的权限范围
    SCOPE: 'user:email',

    // GitHub API 端点
    AUTH_URL: 'https://github.com/login/oauth/authorize',
    TOKEN_URL: 'https://github.com/login/oauth/access_token',
    USER_API: 'https://api.github.com/user',

    // 是否启用调试模式
    DEBUG: true
};

// 获取配置函数
function getGitHubOAuthConfig() {
    return GITHUB_OAUTH_CONFIG;
}

// 验证配置
function validateGitHubOAuthConfig() {
    const config = getGitHubOAuthConfig();

    if (config.CLIENT_ID === 'GITHUB_CLIENT_ID_PLACEHOLDER') {
        console.error('警告：请设置真实的GitHub Client ID');
        return false;
    }

    return true;
}

// 如果在浏览器环境中，将配置添加到全局对象
if (typeof window !== 'undefined') {
    window.GitHubOAuthConfig = GITHUB_OAUTH_CONFIG;
}

// 如果在Node.js环境中，导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GITHUB_OAUTH_CONFIG,
        getGitHubOAuthConfig,
        validateGitHubOAuthConfig
    };
}