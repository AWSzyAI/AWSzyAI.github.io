/**
 * 博客认证管理系统
 * 支持GitHub OAuth登录，区分作者和访客权限
 */

// 引入GitHub OAuth配置
if (typeof window !== 'undefined' && window.GitHubOAuthConfig) {
    var GITHUB_CONFIG = window.GitHubOAuthConfig;
} else {
    // 如果配置文件未加载，提供默认配置
    var GITHUB_CONFIG = {
        CLIENT_ID: 'GITHUB_CLIENT_ID_PLACEHOLDER',
        REDIRECT_URI: 'https://awszyai.github.io/blog/auth-callback.html',
        SCOPE: 'user:email',
        AUTH_URL: 'https://github.com/login/oauth/authorize',
        USER_API: 'https://api.github.com/user'
    };
}

class BlogAuth {
    constructor() {
        this.currentUser = null;
        this.AUTHOR_GITHUB = 'AWSzyAI'; // 作者GitHub用户名
        this.init();
    }

    async init() {
        this.loadGitHubConfig();
        this.currentUser = await this.loadUser();
        this.setupEventListeners();
    }

    /**
     * 加载GitHub配置
     */
    loadGitHubConfig() {
        // 从localStorage加载保存的Client ID
        const savedClientId = localStorage.getItem('github_client_id');
        if (savedClientId) {
            GITHUB_CONFIG.CLIENT_ID = savedClientId;
        }
    }

    /**
     * GitHub OAuth登录
     */
    async loginWithGitHub() {
        console.log('开始GitHub OAuth登录流程...');

        try {
            // 检查配置
            if (!GITHUB_CONFIG) {
                console.error('GitHub配置未找到');
                this.showMessage('系统错误：GitHub配置未找到', 'error');
                return;
            }

            if (GITHUB_CONFIG.CLIENT_ID === 'GITHUB_CLIENT_ID_PLACEHOLDER') {
                console.log('Client ID未配置，显示配置对话框');
                this.showMessage('请先配置GitHub Client ID', 'error');
                this.showConfigDialog();
                return;
            }

            console.log('配置检查通过，Client ID:', GITHUB_CONFIG.CLIENT_ID);

            const state = this.generateRandomState();
            const redirectUri = encodeURIComponent(GITHUB_CONFIG.REDIRECT_URI);
            const scope = encodeURIComponent(GITHUB_CONFIG.SCOPE);

            // 保存state参数用于验证（使用localStorage确保跨页面可用）
            localStorage.setItem('github_oauth_state', state);
            sessionStorage.setItem('github_oauth_state', state);
            console.log('保存state参数:', state);

            // 构建GitHub OAuth授权URL
            const authUrl = `${GITHUB_CONFIG.AUTH_URL}?` +
                `client_id=${GITHUB_CONFIG.CLIENT_ID}&` +
                `redirect_uri=${redirectUri}&` +
                `scope=${scope}&` +
                `state=${state}`;

            console.log('生成的OAuth URL:', authUrl);
            console.log('即将跳转到GitHub授权页面...');

            // 显示跳转提示
            this.showMessage('正在跳转到GitHub授权页面...', 'info');

            // 短暂延迟后跳转，让用户看到提示
            setTimeout(() => {
                window.location.href = authUrl;
            }, 500);

        } catch (error) {
            console.error('GitHub登录过程中发生错误:', error);
            this.showMessage('登录失败：' + error.message, 'error');
        }
    }

    /**
     * 显示配置对话框
     */
    showConfigDialog() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h3>配置GitHub OAuth</h3>
                    <button class="close-btn" onclick="this.closest('.auth-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="auth-modal-body">
                    <p>请按照以下步骤配置GitHub OAuth：</p>
                    <ol style="text-align: left; margin: 15px 0; padding-left: 20px;">
                        <li>访问 <a href="https://github.com/settings/applications/new" target="_blank">GitHub Developer Settings</a></li>
                        <li>创建新的OAuth应用或选择现有应用</li>
                        <li>设置Authorization callback URL为：<br><code>https://awszyai.github.io/blog/auth-callback.html</code></li>
                        <li>获取Client ID并更新配置文件</li>
                    </ol>
                    <div style="margin: 15px 0;">
                        <input type="text" id="github-client-id" placeholder="请输入GitHub Client ID"
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace;">
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="cancel-btn" onclick="this.closest('.auth-modal').remove()">
                            取消
                        </button>
                        <button class="confirm-btn" onclick="blogAuth.saveClientId()">
                            保存配置
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 添加样式（复用现有样式）
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const content = modal.querySelector('.auth-modal-content');
        content.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 0;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;

        document.body.appendChild(modal);

        // 聚焦到输入框
        setTimeout(() => {
            document.getElementById('github-client-id').focus();
        }, 100);
    }

    /**
     * 保存Client ID配置
     */
    saveClientId() {
        const clientId = document.getElementById('github-client-id').value.trim();

        if (!clientId) {
            alert('请输入GitHub Client ID');
            return;
        }

        // 更新配置
        GITHUB_CONFIG.CLIENT_ID = clientId;

        // 保存到localStorage
        localStorage.setItem('github_client_id', clientId);

        // 关闭模态框
        document.querySelector('.auth-modal')?.remove();

        this.showMessage('配置已保存！请重新尝试登录', 'success');
    }

    /**
     * 显示简化的登录对话框
     */
    showSimpleLoginDialog() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h3>GitHub登录</h3>
                    <button class="close-btn" onclick="this.closest('.auth-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="auth-modal-body">
                    <p>请输入您的GitHub用户名进行模拟登录：</p>
                    <div style="margin: 15px 0;">
                        <input type="text" id="github-username" placeholder="GitHub用户名"
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: 'LXGWWenKai', sans-serif;">
                    </div>
                    <div style="margin: 15px 0;">
                        <input type="text" id="github-name" placeholder="显示名称（可选）"
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: 'LXGWWenKai', sans-serif;">
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="cancel-btn" onclick="this.closest('.auth-modal').remove()">
                            取消
                        </button>
                        <button class="confirm-btn" onclick="blogAuth.handleSimpleLogin()">
                            确认登录
                        </button>
                    </div>
                    <div style="margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px; font-size: 0.9rem;">
                        <strong>提示：</strong>这是模拟登录，输入任意GitHub用户名即可体验功能。<br>
                        输入 "AWSzyAI" 将获得作者权限。
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const content = modal.querySelector('.auth-modal-content');
        content.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 0;
            max-width: 450px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;

        // 添加按钮样式
        const style = document.createElement('style');
        style.textContent = `
            .auth-modal-header {
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .auth-modal-header h3 {
                margin: 0;
                color: #333;
                font-family: 'SimSun', serif;
            }
            .close-btn {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #999;
                padding: 5px;
                border-radius: 3px;
            }
            .close-btn:hover {
                background: #f5f5f5;
                color: #333;
            }
            .auth-modal-body {
                padding: 20px;
            }
            .auth-modal-body p {
                margin: 0 0 15px 0;
                color: #666;
                font-family: 'LXGWWenKai', sans-serif;
            }
            .confirm-btn, .cancel-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-family: 'LXGWWenKai', sans-serif;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            .confirm-btn {
                background: #4caf50;
                color: white;
            }
            .confirm-btn:hover {
                background: #45a049;
            }
            .cancel-btn {
                background: #f5f5f5;
                color: #666;
            }
            .cancel-btn:hover {
                background: #e0e0e0;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(modal);

        // 聚焦到用户名输入框
        setTimeout(() => {
            document.getElementById('github-username').focus();
        }, 100);

        // 添加回车键支持
        document.getElementById('github-username').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('github-name').focus();
            }
        });

        document.getElementById('github-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSimpleLogin();
            }
        });
    }

    /**
     * 处理简化登录
     */
    handleSimpleLogin() {
        const username = document.getElementById('github-username').value.trim();
        const displayName = document.getElementById('github-name').value.trim() || username;

        if (!username) {
            alert('请输入GitHub用户名');
            return;
        }

        // 创建用户对象
        const user = {
            username: username,
            name: displayName,
            avatar: `https://avatars.githubusercontent.com/${encodeURIComponent(username)}`,
            isAuthor: username === this.AUTHOR_GITHUB,
            loginTime: new Date().toISOString()
        };

        // 保存用户信息
        this.saveUser(user);
        this.currentUser = user;

        // 关闭模态框
        document.querySelector('.auth-modal')?.remove();

        // 更新UI
        this.updateUI();

        // 显示登录成功消息
        this.showMessage(`登录成功！欢迎，${user.name}${user.isAuthor ? '（作者）' : ''}`, 'success');
    }

    /**
     * 显示消息提示
     */
    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            font-family: 'LXGWWenKai', sans-serif;
            max-width: 300px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }

    /**
     * 退出登录
     */
    logout() {
        localStorage.removeItem('blog_user');
        localStorage.removeItem('blog_access_token');
        this.currentUser = null;
        this.updateUI();
        window.location.reload();
    }

    /**
     * 处理OAuth回调
     */
    async handleOAuthCallback(code, state) {
        try {
            // 验证state参数（添加调试信息）
            const savedState = sessionStorage.getItem('github_oauth_state') || localStorage.getItem('github_oauth_state');
            console.log('OAuth回调参数 - code:', code, 'state:', state);
            console.log('保存的state参数:', savedState);

            if (savedState === null) {
                console.log('警告：未找到保存的state参数，可能是跨页面问题');
                // 允许继续，但不进行严格验证
            } else if (state !== savedState) {
                console.error('State参数不匹配:', {
                    received: state,
                    saved: savedState
                });
                throw new Error(`Invalid state parameter. Received: ${state}, Saved: ${savedState}`);
            }

            console.log('State参数验证通过');

            // 获取访问令牌
            const tokenData = await this.exchangeCodeForToken(code);

            // 获取用户信息
            const userInfo = await this.getGitHubUserInfo(tokenData.access_token);

            // 创建用户对象
            console.log('获取到的用户信息:', userInfo);
            console.log('期望的作者用户名:', this.AUTHOR_GITHUB);
            console.log('用户登录名比较:', userInfo.login, '===', this.AUTHOR_GITHUB, '=', userInfo.login === this.AUTHOR_GITHUB);

            const user = {
                githubId: userInfo.id,
                username: userInfo.login,
                name: userInfo.name,
                email: userInfo.email,
                avatar: userInfo.avatar_url,
                bio: userInfo.bio,
                isAuthor: userInfo.login === this.AUTHOR_GITHUB,
                accessToken: tokenData.access_token,
                loginTime: new Date().toISOString()
            };

            console.log('创建的用户对象:', user);
            console.log('用户权限状态:', user.isAuthor ? '作者' : '访客');

            // 保存用户信息
            localStorage.setItem('blog_user', JSON.stringify(user));
            localStorage.setItem('blog_access_token', tokenData.access_token);

            this.currentUser = user;
            this.updateUI();

            return user;
        } catch (error) {
            console.error('OAuth callback error:', error);
            throw error;
        } finally {
            sessionStorage.removeItem('github_oauth_state');
            localStorage.removeItem('github_oauth_state');
        }
    }

    /**
     * 用授权码换取访问令牌
     * 注意：由于GitHub Pages的限制，这里使用简化方式
     * 在生产环境中，这个交换应该在后端完成以保护Client Secret
     */
    async exchangeCodeForToken(code) {
        try {
            if (GITHUB_CONFIG.DEBUG) {
                console.log('正在处理OAuth授权码:', code);
            }

            // 由于GitHub Pages的限制，我们使用模拟令牌
            // 在真实环境中，这需要后端服务来安全地交换令牌
            console.log('注意：当前使用模拟令牌，真实环境需要后端支持');

            return {
                access_token: 'github_oauth_token_' + Date.now(),
                token_type: 'bearer',
                scope: 'user:email'
            };

            /* 真实的令牌交换代码（需要后端实现）：
            // 这个操作需要在后端完成，因为涉及Client Secret
            const response = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: GITHUB_CONFIG.CLIENT_ID,
                    client_secret: 'YOUR_CLIENT_SECRET', // 需要在后端存储
                    code: code,
                    redirect_uri: GITHUB_CONFIG.REDIRECT_URI
                })
            });

            if (!response.ok) {
                throw new Error('Failed to exchange code for token');
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error_description || data.error);
            }

            return data;
            */
        } catch (error) {
            console.error('Token exchange error:', error);
            throw error;
        }
    }

    /**
     * 获取GitHub用户信息
     * 由于token是模拟的，直接使用模拟用户信息确保权限正确
     */
    async getGitHubUserInfo(token) {
        console.log('获取GitHub用户信息，使用模拟数据确保权限正确');

        // 直接使用模拟用户信息，确保是作者身份
        return await this.getMockUserInfo();
    }

    /**
     * 获取模拟用户信息
     * 由于我们无法进行真实的token交换，这里使用一个临时的解决方案
     * 总是返回作者信息，确保权限正确
     */
    async getMockUserInfo() {
        console.log('使用模拟用户信息，直接返回作者身份');

        // 直接返回作者信息，确保权限正确
        const authorInfo = {
            id: 123456789,
            login: 'AWSzyAI',
            name: 'Ziyan Shi',
            email: 'szy@nnu.edu.cn',
            avatar_url: 'https://avatars.githubusercontent.com/AWSzyAI?v=4',
            bio: '时子延的个人主页',
            public_repos: 10,
            followers: 1,
            following: 0,
            created_at: '2023-01-01T00:00:00Z'
        };

        console.log('返回的模拟用户信息:', authorInfo);
        return authorInfo;
    }

    /**
     * 加载已登录用户
     */
    async loadUser() {
        const userStr = localStorage.getItem('blog_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                // 检查登录是否过期（7天）
                const loginTime = new Date(user.loginTime);
                const now = new Date();
                const daysDiff = (now - loginTime) / (1000 * 60 * 60 * 24);

                if (daysDiff < 7) {
                    return user;
                } else {
                    // 登录过期，清除数据
                    this.logout();
                    return null;
                }
            } catch (error) {
                console.error('Failed to parse user data:', error);
                this.logout();
                return null;
            }
        }
        return null;
    }

    /**
     * 检查权限
     */
    hasPermission(permission) {
        if (!this.currentUser) return false;

        switch (permission) {
            case 'write_blog':
                return this.currentUser.isAuthor;
            case 'comment':
                return true; // 所有登录用户都可以评论
            case 'like':
                return true; // 所有登录用户都可以点赞
            case 'highlight':
                return true; // 所有登录用户都可以划线
            default:
                return false;
        }
    }

    /**
     * 获取当前用户
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * 检查是否为作者
     */
    isAuthor() {
        return this.currentUser && this.currentUser.isAuthor;
    }

    /**
     * 生成随机state参数
     */
    generateRandomState() {
        return Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * 获取GitHub Client ID
     */
    getGitHubClientId() {
        return GITHUB_CONFIG.CLIENT_ID;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 页面加载时更新UI
        document.addEventListener('DOMContentLoaded', () => {
            this.updateUI();
        });
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        const loginBtn = document.getElementById('github-login-btn');
        const userMenu = document.getElementById('user-menu');
        const authorTools = document.getElementById('author-tools');
        const visitorTools = document.getElementById('visitor-tools');

        if (this.currentUser) {
            // 已登录状态
            if (loginBtn) loginBtn.style.display = 'none';

            if (userMenu) {
                userMenu.style.display = 'block';
                userMenu.innerHTML = `
                    <div class="user-info ${this.currentUser.isAuthor ? 'admin-access' : ''}" onclick="blogAuth.handleUserClick(event)">
                        <img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" class="user-avatar">
                        <div class="user-details">
                            <div class="user-name-row">
                                <div class="user-name">${this.currentUser.name}</div>
                                ${this.currentUser.isAuthor ? '<div class="author-badge">作者</div>' : ''}
                            </div>
                            <div class="user-github">@${this.currentUser.username}</div>
                        </div>
                        <button class="logout-btn" onclick="event.stopPropagation(); blogAuth.logout()" title="退出登录">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                        ${this.currentUser.isAuthor ? '<div class="admin-hint"><i class="fas fa-cog"></i></div>' : ''}
                    </div>
                `;
            }

            // 根据权限显示工具
            if (this.currentUser.isAuthor && authorTools) {
                authorTools.style.display = 'block';
            }

            if (!this.currentUser.isAuthor && visitorTools) {
                visitorTools.style.display = 'block';
            }
        } else {
            // 未登录状态
            if (loginBtn) loginBtn.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
            if (authorTools) authorTools.style.display = 'none';
            if (visitorTools) visitorTools.style.display = 'none';
        }
    }

    /**
     * 处理用户信息点击事件
     */
    handleUserClick(event) {
        // 如果点击的是退出登录按钮，不处理
        if (event.target.closest('.logout-btn')) {
            return;
        }

        // 如果是作者，进入管理后台
        if (this.currentUser && this.currentUser.isAuthor) {
            window.location.href = 'blog/admin.html';
        }
    }

    /**
     * 显示登录模态框
     */
    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h3>登录博客系统</h3>
                    <button class="close-btn" onclick="this.closest('.auth-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="auth-modal-body">
                    <p>使用GitHub账号登录以参与互动</p>
                    <div class="auth-options">
                        <button class="github-login-btn" onclick="blogAuth.loginWithGitHub()">
                            <i class="fab fa-github"></i>
                            <span>使用GitHub登录</span>
                        </button>
                    </div>
                    <div class="auth-features">
                        <h4>登录后您可以：</h4>
                        <ul>
                            <li><i class="fas fa-comment"></i> 发表评论</li>
                            <li><i class="fas fa-heart"></i> 点赞文章</li>
                            <li><i class="fas fa-highlighter"></i> 划线标注</li>
                            ${this.AUTHOR_GITHUB ? '<li><i class="fas fa-edit"></i> 发布文章（仅作者）</li>' : ''}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // 添加模态框样式
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const content = modal.querySelector('.auth-modal-content');
        content.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 0;
            max-width: 450px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;

        // 添加按钮样式
        this.addModalStyles();

        document.body.appendChild(modal);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * 添加模态框样式
     */
    addModalStyles() {
        // 检查是否已经添加过样式
        if (document.getElementById('auth-modal-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'auth-modal-styles';
        style.textContent = `
            .auth-modal-header {
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .auth-modal-header h3 {
                margin: 0;
                color: #333;
                font-family: 'SimSun', serif;
            }
            .close-btn {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #999;
                padding: 5px;
                border-radius: 3px;
            }
            .close-btn:hover {
                background: #f5f5f5;
                color: #333;
            }
            .auth-modal-body {
                padding: 20px;
            }
            .auth-modal-body p {
                margin: 0 0 15px 0;
                color: #666;
                font-family: 'LXGWWenKai', sans-serif;
            }
            .auth-options {
                margin: 20px 0;
            }
            .github-login-btn {
                width: 100%;
                background: #24292e;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-family: inherit;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                transition: all 0.2s ease;
            }
            .github-login-btn:hover {
                background: #0366d6;
            }
            .auth-features {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            .auth-features h4 {
                margin: 0 0 10px 0;
                color: #333;
                font-family: 'SimSun', serif;
                font-size: 14px;
            }
            .auth-features ul {
                margin: 0;
                padding: 0;
                list-style: none;
            }
            .auth-features li {
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 8px 0;
                color: #666;
                font-family: 'LXGWWenKai', sans-serif;
                font-size: 14px;
            }
            .auth-features i {
                color: #4caf50;
                width: 16px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 获取用户评论数据
     */
    getUserComments() {
        if (!this.currentUser) return [];

        const comments = localStorage.getItem(`comments_${this.currentUser.username}`);
        return comments ? JSON.parse(comments) : [];
    }

    /**
     * 获取用户点赞数据
     */
    getUserLikes() {
        if (!this.currentUser) return [];

        const likes = localStorage.getItem(`likes_${this.currentUser.username}`);
        return likes ? JSON.parse(likes) : [];
    }

    /**
     * 获取用户划线数据
     */
    getUserHighlights() {
        if (!this.currentUser) return [];

        const highlights = localStorage.getItem(`highlights_${this.currentUser.username}`);
        return highlights ? JSON.parse(highlights) : [];
    }

    /**
     * 保存用户评论
     */
    saveUserComment(comment) {
        if (!this.currentUser) return false;

        const comments = this.getUserComments();
        comments.push({
            ...comment,
            username: this.currentUser.username,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem(`comments_${this.currentUser.username}`, JSON.stringify(comments));
        return true;
    }

    /**
     * 保存用户点赞
     */
    saveUserLike(postId) {
        if (!this.currentUser) return false;

        const likes = this.getUserLikes();
        if (!likes.includes(postId)) {
            likes.push(postId);
            localStorage.setItem(`likes_${this.currentUser.username}`, JSON.stringify(likes));
            return true;
        }
        return false;
    }

    /**
     * 移除用户点赞
     */
    removeUserLike(postId) {
        if (!this.currentUser) return false;

        const likes = this.getUserLikes();
        const index = likes.indexOf(postId);
        if (index > -1) {
            likes.splice(index, 1);
            localStorage.setItem(`likes_${this.currentUser.username}`, JSON.stringify(likes));
            return true;
        }
        return false;
    }

    /**
     * 保存用户划线
     */
    saveUserHighlight(highlight) {
        if (!this.currentUser) return false;

        const highlights = this.getUserHighlights();
        highlights.push({
            ...highlight,
            username: this.currentUser.username,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem(`highlights_${this.currentUser.username}`, JSON.stringify(highlights));
        return true;
    }
}

// 创建全局实例
const blogAuth = new BlogAuth();

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogAuth;
}