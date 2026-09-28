/**
 * Legacy blog authentication boundary.
 *
 * The old GitHub OAuth flow was a browser-only mock and could grant author
 * access to anyone. The static site has no trusted backend, so this surface
 * fails closed until a real server-side authentication flow is available.
 */
class BlogAuth {
    constructor() {
        this.currentUser = null;
        this.AUTHOR_GITHUB = 'AWSzyAI';
        this.init();
    }

    async init() {
        localStorage.removeItem('blog_user');
        localStorage.removeItem('blog_access_token');
        this.updateUI();
    }

    showUnavailable() {
        this.showMessage('博客登录已停用：当前静态站点没有安全的认证后端。', 'error');
    }

    loginWithGitHub() { this.showUnavailable(); }
    showLoginModal() { this.showUnavailable(); }
    showConfigDialog() { this.showUnavailable(); }
    showSimpleLoginDialog() { this.showUnavailable(); }

    async handleOAuthCallback() {
        throw new Error('博客 OAuth 已停用：当前静态站点没有安全的认证后端。');
    }

    handleSimpleLogin() { this.showUnavailable(); }

    logout() {
        localStorage.removeItem('blog_user');
        localStorage.removeItem('blog_access_token');
        this.currentUser = null;
        this.updateUI();
    }

    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.setAttribute('role', 'status');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10001;
            max-width: 320px; padding: 15px 20px; border-radius: 8px;
            color: white; background: ${type === 'error' ? '#b42318' : '#2563eb'};
            box-shadow: 0 4px 12px rgba(0, 0, 0, .15);
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    updateUI() {
        const loginBtn = document.getElementById('github-login-btn');
        const userMenu = document.getElementById('user-menu');
        const authorTools = document.getElementById('author-tools');
        const visitorTools = document.getElementById('visitor-tools');
        if (loginBtn) loginBtn.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
        if (authorTools) authorTools.style.display = 'none';
        if (visitorTools) visitorTools.style.display = 'none';
    }

    handleUserClick() { this.showUnavailable(); }
    getCurrentUser() { return null; }
    isLoggedIn() { return false; }
    isAuthor() { return false; }
    hasPermission() { return false; }

    getUserComments() { return []; }
    getUserLikes() { return []; }
    getUserHighlights() { return []; }
    saveUserComment() { return false; }
    saveUserLike() { return false; }
    removeUserLike() { return false; }
    saveUserHighlight() { return false; }
}

window.blogAuth = new BlogAuth();
const blogAuth = window.blogAuth;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogAuth;
}
