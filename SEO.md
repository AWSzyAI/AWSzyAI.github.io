# 搜索发现与发布

正式站点：https://awszyai.github.io/

## 已配置

- 首页与当前简历均为静态 HTML，中文姓名、英文姓名、机构、研究与论文无需 JavaScript 即可读取。
- 两页各自的标题、摘要、HTTPS canonical、robots meta、Open Graph 与 Twitter 分享卡片。
- 首页 WebSite 站点名称「时子延」，并通过 ProfilePage / Person 表达个人身份。简历关联同一人物实体，不把个人品牌冒充为注册公司。
- 分享卡片：`assets/social/ziyan-shi.png`，1200 × 630，沿用现有字体和配色。
- `robots.txt` 开放抓取，包括 Googlebot、Bingbot、Baiduspider，并声明根站点地图。
- `sitemap.xml` 聚焦首页与当前简历，使用 canonical URL 和真实修改日期；页面锚点、历史重复简历不单独提交。
- `.nojekyll` 使 GitHub Pages 直接发布本仓库的静态资源。
- `indexnow-key.txt` 是用于网站所有权验证的公开文件，不是账号登录密钥。`scripts/submit-indexnow.py` 在核对线上 key 和页面内容后，向 IndexNow 提交站点地图中的网址。它不会在网站访客的浏览器里发送通知，也不接触访客信息。

## 发布后主动通知

先运行检查，再推送。等 GitHub Pages 部署完成后执行：

```sh
python3 scripts/check-seo.py
node --test tests/research-models.test.cjs
python3 scripts/submit-indexnow.py --dry-run
# Pages 成功、线上页面与当前文件一致后：
python3 scripts/submit-indexnow.py
```

HTTP 200 表示请求已处理；HTTP 202 表示已接收、等待 key 验证。两者都不等于页面已经收录。只需通知一个 IndexNow 参与端点，参与引擎之间会共享通知。Google 和百度的站长提交不由该脚本代替。避免没有内容变化时反复提交。

## Google 与百度：账号验证留待后续

2026-09-13 用户选择先完成部署，站长验证稍后处理。没有添加虚假的验证标签或未经提供的验证码。

- [Google Search Console](https://search.google.com/search-console/)：添加网址前缀资源 `https://awszyai.github.io/`。GitHub Pages 子域不能由本仓库修改 DNS，使用 HTML 文件或 HTML meta 验证；验证值必须从用户的 Search Console 获取。验证后提交 `sitemap.xml`，对首页和简历执行网址检查并请求编入索引。
- [百度搜索资源平台](https://ziyuan.baidu.com/)：添加并验证 `https://awszyai.github.io`；使用平台提供的文件或 meta 验证。验证后按账号可用的资源提交方式提交首页、简历或站点地图。不能猜测站点 ID、token 或配额。
- [Bing Webmaster Tools](https://www.bing.com/webmasters/)：IndexNow 已提供主动发现入口；登录并验证站点后还可查看抓取和索引报告。

需要提交的站点地图：https://awszyai.github.io/sitemap.xml

## 维护

修改正文时同步更新站点地图中对应页面的 lastmod，以及 ProfilePage 的 dateModified。保留页面的唯一 canonical 和原有公开联系信息。不要将个人资产、税务数据、平台私密 token 或凭据写入公开仓库。不要为追求索引数量把重定向、旧简历、维护说明或页面内锚点堆入 sitemap。

生成分享图使用 `scripts/build-social-card.py`（Pillow），无需重新生成首页的动画素材。

参考：[Google 站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)、[Google 站点名称](https://developers.google.com/search/docs/appearance/site-names)、[Google 个人资料结构化信息](https://developers.google.com/search/docs/appearance/structured-data/profile-page)、[IndexNow 协议](https://www.indexnow.org/documentation)。搜索引擎决定抓取、收录及排名，技术配置无法保证立即收录。
