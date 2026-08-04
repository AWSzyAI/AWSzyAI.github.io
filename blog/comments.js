/**
 * 博客评论系统
 * 支持GitHub登录用户发表评论、点赞和划线
 */

class BlogComments {
    constructor() {
        this.postId = null;
        this.comments = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPostId();
        if (this.postId) {
            this.loadComments();
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.renderComments();
            this.updateUI();
        });
    }

    /**
     * 获取当前文章ID
     */
    loadPostId() {
        const urlParams = new URLSearchParams(window.location.search);
        this.postId = urlParams.get('id');
    }

    /**
     * 加载评论
     */
    loadComments() {
        if (!this.postId) return;

        const stored = localStorage.getItem(`comments_post_${this.postId}`);
        this.comments = stored ? JSON.parse(stored) : [];
    }

    /**
     * 保存评论
     */
    saveComments() {
        if (!this.postId) return;

        localStorage.setItem(`comments_post_${this.postId}`, JSON.stringify(this.comments));
    }

    /**
     * 渲染评论区域
     */
    renderComments() {
        const container = document.getElementById('comments-container');
        if (!container) return;

        container.innerHTML = `
            <div class="comments-section">
                <div class="comments-header">
                    <h3><i class="fas fa-comments"></i> 评论 (${this.comments.length})</h3>
                    ${blogAuth.isLoggedIn() ? this.createCommentForm() : this.createLoginPrompt()}
                </div>
                <div class="comments-list" id="comments-list">
                    ${this.renderCommentList()}
                </div>
            </div>
        `;

        if (blogAuth.isLoggedIn()) {
            this.setupCommentForm();
        }
    }

    /**
     * 创建评论表单
     */
    createCommentForm() {
        const user = blogAuth.getCurrentUser();
        return `
            <div class="comment-form">
                <div class="user-avatar">
                    <img src="${user.avatar}" alt="${user.name}">
                </div>
                <div class="comment-input-container">
                    <textarea
                        id="comment-input"
                        placeholder="写下你的评论..."
                        class="comment-textarea"
                        rows="3"
                    ></textarea>
                    <div class="comment-actions">
                        <button id="submit-comment" class="submit-btn">
                            <i class="fas fa-paper-plane"></i>
                            发表评论
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 创建登录提示
     */
    createLoginPrompt() {
        return `
            <div class="login-prompt">
                <i class="fas fa-sign-in-alt"></i>
                <button onclick="blogAuth.showLoginModal()" class="login-btn">
                    登录后发表评论
                </button>
            </div>
        `;
    }

    /**
     * 渲染评论列表
     */
    renderCommentList() {
        if (this.comments.length === 0) {
            return `
                <div class="no-comments">
                    <i class="fas fa-comment-slash"></i>
                    <p>还没有评论，来发表第一条评论吧！</p>
                </div>
            `;
        }

        return this.comments.map(comment => this.renderComment(comment)).join('');
    }

    /**
     * 渲染单个评论
     */
    renderComment(comment) {
        const currentUser = blogAuth.getCurrentUser();
        const isAuthor = currentUser && currentUser.username === comment.username;
        const canDelete = isAuthor || (currentUser && currentUser.isAuthor);

        return `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-avatar">
                    <img src="${comment.avatar}" alt="${comment.name}">
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <div class="comment-author">
                            <span class="author-name">${comment.name}</span>
                            <span class="author-github">@${comment.username}</span>
                            ${comment.username === 'AWSzyAI' ? '<span class="author-badge">作者</span>' : ''}
                        </div>
                        <div class="comment-meta">
                            <span class="comment-time">${this.formatTime(comment.timestamp)}</span>
                            ${canDelete ? `
                                <button class="delete-comment" onclick="blogComments.deleteComment('${comment.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="comment-body">
                        ${this.parseCommentContent(comment.content)}
                    </div>
                    <div class="comment-actions">
                        <button class="comment-action ${comment.liked ? 'liked' : ''}"
                                onclick="blogComments.likeComment('${comment.id}')">
                            <i class="fas fa-heart"></i>
                            <span>${comment.likes || 0}</span>
                        </button>
                        <button class="comment-action" onclick="blogComments.replyComment('${comment.id}')">
                            <i class="fas fa-reply"></i>
                            回复
                        </button>
                    </div>
                    ${comment.replies && comment.replies.length > 0 ? `
                        <div class="comment-replies">
                            ${comment.replies.map(reply => this.renderComment(reply)).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 解析评论内容
     */
    parseCommentContent(content) {
        // 简单的markdown解析
        return content
            // 处理代码块
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            // 处理行内代码
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 处理链接
            .replace(/https?:\/\/([^\s]+)/g, '<a href="https://$1" target="_blank">https://$1</a>')
            // 处理@提及
            .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
            // 处理换行
            .replace(/\n/g, '<br>');
    }

    /**
     * 设置评论表单
     */
    setupCommentForm() {
        const submitBtn = document.getElementById('submit-comment');
        const textArea = document.getElementById('comment-input');

        if (submitBtn && textArea) {
            submitBtn.addEventListener('click', () => this.submitComment());

            // Ctrl+Enter提交评论
            textArea.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    this.submitComment();
                }
            });
        }
    }

    /**
     * 提交评论
     */
    submitComment() {
        if (!blogAuth.isLoggedIn()) {
            blogAuth.showLoginModal();
            return;
        }

        const textArea = document.getElementById('comment-input');
        const content = textArea.value.trim();

        if (!content) {
            this.showMessage('请输入评论内容', 'warning');
            return;
        }

        const user = blogAuth.getCurrentUser();
        const comment = {
            id: this.generateId(),
            content: content,
            name: user.name,
            username: user.username,
            avatar: user.avatar,
            timestamp: new Date().toISOString(),
            likes: 0,
            liked: false,
            replies: []
        };

        this.comments.unshift(comment);
        this.saveComments();
        this.renderComments();

        // 保存用户评论记录
        blogAuth.saveUserComment({
            postId: this.postId,
            commentId: comment.id
        });

        this.showMessage('评论发表成功！', 'success');
    }

    /**
     * 删除评论
     */
    deleteComment(commentId) {
        const user = blogAuth.getCurrentUser();
        if (!user) return;

        const comment = this.findComment(commentId);
        if (!comment) return;

        // 检查权限：作者或文章作者可以删除
        if (comment.username !== user.username && !user.isAuthor) {
            this.showMessage('没有权限删除此评论', 'error');
            return;
        }

        if (confirm('确定要删除这条评论吗？')) {
            this.comments = this.comments.filter(c => c.id !== commentId);
            this.saveComments();
            this.renderComments();
            this.showMessage('评论已删除', 'success');
        }
    }

    /**
     * 点赞评论
     */
    likeComment(commentId) {
        if (!blogAuth.isLoggedIn()) {
            blogAuth.showLoginModal();
            return;
        }

        const comment = this.findComment(commentId);
        if (!comment) return;

        const user = blogAuth.getCurrentUser();
        const likeKey = `comment_like_${user.username}_${commentId}`;
        const hasLiked = localStorage.getItem(likeKey) === 'true';

        if (hasLiked) {
            comment.likes = Math.max(0, (comment.likes || 0) - 1);
            localStorage.setItem(likeKey, 'false');
        } else {
            comment.likes = (comment.likes || 0) + 1;
            localStorage.setItem(likeKey, 'true');
        }

        this.saveComments();
        this.renderComments();
    }

    /**
     * 回复评论
     */
    replyComment(commentId) {
        if (!blogAuth.isLoggedIn()) {
            blogAuth.showLoginModal();
            return;
        }

        const comment = this.findComment(commentId);
        if (!comment) return;

        const replyContent = prompt('回复 @' + comment.username + '：');
        if (!replyContent || !replyContent.trim()) return;

        const user = blogAuth.getCurrentUser();
        const reply = {
            id: this.generateId(),
            content: replyContent.trim(),
            name: user.name,
            username: user.username,
            avatar: user.avatar,
            timestamp: new Date().toISOString(),
            likes: 0,
            liked: false,
            replies: []
        };

        if (!comment.replies) {
            comment.replies = [];
        }
        comment.replies.push(reply);

        this.saveComments();
        this.renderComments();
        this.showMessage('回复成功！', 'success');
    }

    /**
     * 查找评论
     */
    findComment(commentId, comments = this.comments) {
        for (let comment of comments) {
            if (comment.id === commentId) {
                return comment;
            }
            if (comment.replies) {
                const found = this.findComment(commentId, comment.replies);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;

        return date.toLocaleDateString('zh-CN');
    }

    /**
     * 显示消息提示
     */
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `comment-message ${type}`;
        messageDiv.textContent = message;

        const container = document.getElementById('comments-container');
        if (container) {
            container.appendChild(messageDiv);

            setTimeout(() => {
                if (container.contains(messageDiv)) {
                    container.removeChild(messageDiv);
                }
            }, 3000);
        }
    }

    /**
     * 更新UI
     */
    updateUI() {
        // 监听登录状态变化
        if (typeof blogAuth !== 'undefined') {
            blogAuth.updateUI();
        }
    }
}

// 点赞功能
class BlogLikes {
    constructor() {
        this.postId = null;
        this.likes = [];
        this.init();
    }

    init() {
        this.loadPostId();
        if (this.postId) {
            this.loadLikes();
            this.renderLikeButton();
        }
    }

    loadPostId() {
        const urlParams = new URLSearchParams(window.location.search);
        this.postId = urlParams.get('id');
    }

    loadLikes() {
        const stored = localStorage.getItem(`likes_post_${this.postId}`);
        this.likes = stored ? JSON.parse(stored) : [];
    }

    saveLikes() {
        localStorage.setItem(`likes_post_${this.postId}`, JSON.stringify(this.likes));
    }

    renderLikeButton() {
        const container = document.getElementById('like-button-container');
        if (!container) return;

        const user = blogAuth.getCurrentUser();
        const hasLiked = user && this.likes.includes(user.username);
        const likeCount = this.likes.length;

        container.innerHTML = `
            <button class="like-btn ${hasLiked ? 'liked' : ''}"
                    onclick="blogLikes.toggleLike()">
                <i class="fas fa-heart"></i>
                <span class="like-count">${likeCount}</span>
                <span class="like-text">${hasLiked ? '已赞' : '点赞'}</span>
            </button>
        `;
    }

    toggleLike() {
        if (!blogAuth.isLoggedIn()) {
            blogAuth.showLoginModal();
            return;
        }

        const user = blogAuth.getCurrentUser();
        const index = this.likes.indexOf(user.username);

        if (index > -1) {
            // 取消点赞
            this.likes.splice(index, 1);
        } else {
            // 点赞
            this.likes.push(user.username);
        }

        this.saveLikes();
        this.renderLikeButton();
    }
}

// 初始化
const blogComments = new BlogComments();
const blogLikes = new BlogLikes();

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlogComments, BlogLikes };
}