# 时子延的个人主页

[![Website](https://img.shields.io/badge/Website-Online-success)](https://awszyai.github.io)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-informational)](https://github.com/AWSzyAI/AWSzyAI.github.io)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

## 🌟 概述

这是我的个人主页，展示我的知识管理系统、技术文档和项目作品集。网站采用现代化设计，以绿色为主色调，突出知识管理和技能分享。具有响应式设计、玻璃拟态效果和流畅的交互动画。

## 📚 核心内容

### 🧠 Obsidian 知识库
个人知识管理系统，包含：
- 学习笔记和思维导图
- 技术文档和代码片段
- 项目记录和心得体会
- [访问知识库](https://awszyai.github.io/obsidian)

### 📖 MkDocs 文档
结构化技术文档，涵盖：
- 编程技能和开发经验
- 课程学习资料
- 设备评测和使用心得
- [访问文档](https://awszyai.github.io/MkDocs/site)

## 🗂️ 项目归档

### 大创项目：LLM&KG
大语言模型与知识图谱融合的创新研究项目
- [查看详情](https://awszyai.github.io/Archive/大创-LLM-KG/大创-LLM&KG/llm-meet-kg.html)

### 2024 暑期计划
暑期学习计划，包括读书笔记、课程学习和技术工具
- [查看详情](https://awszyai.github.io/Archive/2024Summer/2024Summer/index.html)

### C++课程设计
完整的C++课程项目，包含设计文档和代码实现
- [查看详情](https://awszyai.github.io/Archive/C++课程设计/c++课程设计.html)

## 🚀 快速导航

- [个人简历](https://awszyai.github.io/obsidian/Resume/Szy-CV.html)
- [关于我](https://awszyai.github.io/MkDocs/site/about/index.html)
- [技术栈](https://awszyai.github.io/MkDocs/site/skills/my-skills/linux/index.html)
- [我的装备](https://awszyai.github.io/MkDocs/site/gears/macbook-air-m2/index.html)

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, 内嵌式样式表

## 📝 博客系统架构与迁移指南

### 🏗️ 当前架构概述

本博客系统采用纯前端架构，数据存储在浏览器的 localStorage 中，具有以下特点：

#### 数据存储格式
```json
{
  "blog_posts": [
    {
      "id": 1759557862038,                    // 时间戳ID
      "title": "文章标题",                      // 文章标题
      "excerpt": "文章摘要",                    // 文章摘要
      "content": "文章内容(Markdown)",         // Markdown格式的正文内容
      "author": "作者名",                      // 作者名称
      "tags": ["标签1", "标签2"],             // 文章标签数组
      "featured": false,                      // 是否为精选文章
      "date": "2024-01-01"                    // 发布日期(ISO格式)
    }
  ]
}
```

#### 核心文件结构
```
blog/
├── index.html          # 博客首页(列表页)
├── post.html           # 文章详情页
├── admin.html          # 管理后台
├── edit.html           # 编辑器页面
├── auth.js             # GitHub OAuth认证
├── github-oauth-config.js  # OAuth配置
└── README.md           # 说明文档
```

### 🔄 迁移到其他平台指南

#### 1. 数据导出格式

为了便于迁移，建议将博客数据导出为以下标准格式：

**Markdown文件格式**
```markdown
---
title: "文章标题"
date: 2024-01-01
author: "作者名"
tags: ["标签1", "标签2"]
featured: false
excerpt: "文章摘要"
---

# 文章标题

文章正文内容(Markdown格式)
```

**JSON格式备份**
```json
{
  "version": "1.0",
  "export_date": "2024-01-01T00:00:00Z",
  "posts": [
    {
      "id": 1759557862038,
      "title": "文章标题",
      "slug": "article-slug",  // URL友好的标识符
      "excerpt": "文章摘要",
      "content": "文章内容",
      "author": "作者名",
      "tags": ["标签1", "标签2"],
      "featured": false,
      "date": "2024-01-01",
      "updated": "2024-01-01",  // 最后更新时间
      "status": "published"     // 文章状态
    }
  ]
}
```

#### 2. 迁移到静态站点生成器

**Hugo迁移**
```yaml
# content/posts/article-title.md
---
title: "文章标题"
date: 2024-01-01
author: "作者名"
tags: ["标签1", "标签2"]
featured: false
draft: false
---

文章内容
```

**Jekyll迁移**
```yaml
# _posts/2024-01-01-article-title.md
---
layout: post
title: "文章标题"
date: 2024-01-01 00:00:00 +0000
author: "作者名"
tags: ["标签1", "标签2"]
excerpt: "文章摘要"
---

文章内容
```

**Hexo迁移**
```yaml
# source/_posts/article-title.md
---
title: "文章标题"
date: 2024-01-01 00:00:00
author: "作者名"
tags: ["标签1", "标签2"]
excerpt: "文章摘要"
---

文章内容
```

#### 3. 迁移到CMS系统

**Strapi/Headless CMS**
```json
POST /api/articles
{
  "data": {
    "title": "文章标题",
    "content": "文章内容",
    "excerpt": "文章摘要",
    "author": "作者名",
    "tags": ["标签1", "标签2"],
    "publishedAt": "2024-01-01T00:00:00Z",
    "featured": false
  }
}
```

**WordPress REST API**
```json
POST /wp/v2/posts
{
  "title": "文章标题",
  "content": "文章内容",
  "excerpt": "文章摘要",
  "author": 1,
  "tags": [1, 2],
  "status": "publish",
  "featured": false
}
```

#### 4. 数据转换脚本示例

**JavaScript数据提取脚本**
```javascript
// 在浏览器控制台运行，提取所有博客文章数据
function exportBlogData() {
    const posts = JSON.parse(localStorage.getItem('blog_posts') || '[]');

    // 转换为标准格式
    const exportedData = {
        version: "1.0",
        export_date: new Date().toISOString(),
        posts: posts.map(post => ({
            id: post.id,
            title: post.title,
            slug: post.title.toLowerCase()
                .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, ''),
            excerpt: post.excerpt,
            content: post.content,
            author: post.author,
            tags: post.tags,
            featured: post.featured,
            date: post.date,
            updated: post.date,
            status: "published"
        }))
    };

    // 下载JSON文件
    const blob = new Blob([JSON.stringify(exportedData, null, 2)],
                         { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blog-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return exportedData;
}

// 运行导出
exportBlogData();
```

**Markdown文件生成脚本**
```javascript
function generateMarkdownFiles(posts) {
    posts.forEach(post => {
        const frontmatter = `---
title: "${post.title}"
date: ${post.date}
author: "${post.author}"
tags: [${post.tags.map(tag => `"${tag}"`).join(', ')}]
featured: ${post.featured}
excerpt: "${post.excerpt}"
---

${post.content}`;

        // 创建并下载Markdown文件
        const blob = new Blob([frontmatter], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${post.date}-${post.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}.md`;
        a.click();
        URL.revokeObjectURL(url);
    });
}
```

#### 5. 迁移检查清单

- [ ] **数据备份**: 完整导出localStorage中的blog_posts数据
- [ ] **格式转换**: 根据目标平台要求转换数据格式
- [ ] **文件命名**: 确保文件名符合目标平台规范
- [ ] **图片处理**: 检查并迁移文章中的图片资源
- [ ] **链接修复**: 更新内部链接和引用
- [ ] **SEO优化**: 添加meta标签和结构化数据
- [ ] **功能测试**: 验证所有功能正常工作
- [ ] **性能优化**: 优化加载速度和用户体验

#### 6. 常见迁移路径

**到Hugo**
```bash
# 1. 导出数据
npm run export-blog

# 2. 转换格式
node convert-to-hugo.js

# 3. 生成静态站点
hugo new site my-blog
cp -r content/* my-blog/content/
hugo
```

**到WordPress**
```php
// WordPress导入脚本
<?php
require_once('wp-load.php');

$json_data = file_get_contents('blog-export.json');
$posts = json_decode($json_data, true)['posts'];

foreach ($posts as $post_data) {
    $post_id = wp_insert_post([
        'post_title' => $post_data['title'],
        'post_content' => $post_data['content'],
        'post_excerpt' => $post_data['excerpt'],
        'post_status' => 'publish',
        'post_author' => 1,
        'post_date' => $post_data['date']
    ]);

    // 添加标签
    foreach ($post_data['tags'] as $tag_name) {
        wp_set_post_tags($post_id, $tag_name, true);
    }
}
?>
```

### 🚀 性能优化建议

1. **图片优化**: 使用WebP格式，实现懒加载
2. **代码分割**: 按需加载JavaScript和CSS
3. **缓存策略**: 实现Service Worker缓存
4. **CDN部署**: 使用CDN加速静态资源
5. **压缩优化**: Gzip/Brotli压缩文本内容
- **设计**: 响应式设计, CSS Grid, Flexbox, CSS 自定义属性
- **动画**: CSS Transitions, Keyframes, Transform
- **字体**: Inter (Google Fonts)
- **图标**: Font Awesome 6.0
- **部署**: GitHub Pages
- **版本控制**: Git

## 🎨 设计特色

- 🎯 **绿色主题**: 以 #006400 为主的绿色配色方案
- 📱 **响应式**: 适配各种设备尺寸，完美支持移动端
- ✨ **动画效果**: 流畅的过渡和悬停动画，淡入上移动效
- 🔍 **清晰导航**: 直观的信息架构，整卡片可点击
- 🪟 **玻璃拟态**: 现代化的毛玻璃效果和渐变背景
- 🔗 **GitHub 角标**: 右上角 GitHub 仓库链接，带动画效果
- 🖼️ **个人标识**: 自定义 favicon 和头像展示

## 📝 本地开发

```bash
# 克隆仓库
git clone https://github.com/AWSzyAI/AWSzyAI.github.io.git
cd AWSzyAI.github.io

# 启动本地服务器
python3 -m http.server 8000

# 访问 http://localhost:8000
```

### 项目结构
```
AWSzyAI.github.io/
├── index.html          # 主页（包含内嵌 CSS）
├── style.css           # 样式文件（已弃用，样式已内嵌）
├── README.md           # 项目说明文档
├── szy.ico            # 网站 favicon
├── obsidian/          # Obsidian 知识库
├── MkDocs/            # MkDocs 文档系统
└── Archive/           # 项目归档
    ├── 大创-LLM-KG/
    ├── 2024Summer/
    └── C++课程设计/
```

### 更新日志
- **v2.0** (2024-10): 完全重新设计，现代化界面，玻璃拟态效果
- **v1.5** (2024-09): 修复 GitHub Pages 渲染问题，内嵌 CSS
- **v1.0** (2024-08): 初始版本，基础功能实现

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🌟 特色功能

- **🔗 智能导航**: 整卡片可点击，提升用户体验
- **📱 移动优化**: 完美适配手机和平板设备
- **⚡ 快速加载**: 内嵌 CSS 减少 HTTP 请求
- **🎯 SEO 友好**: 语义化 HTML5 结构
- **🔗 GitHub 集成**: 一键访问源代码仓库

## 📊 访问统计

- 🌐 **在线地址**: [https://awszyai.github.io](https://awszyai.github.io)
- 📈 **部署状态**: GitHub Pages 自动部署
- 🔄 **更新频率**: 持续更新中

---

> 💡 **提示**: 这个网站持续更新中，欢迎访问查看最新的内容！如果喜欢这个设计，别忘了给 GitHub 仓库点个 ⭐ Star！

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>