# 项目记忆与维护手册

最后更新：2026-08-05  
工作目录：`C:\Users\szy\Downloads\AWSzyAI.github.io`  
正式站点：<https://awszyai.github.io/>

这份文档用于在下次维护时快速恢复上下文。仓库是公开的，因此只记录架构、决策和恢复流程，不记录真实财务明细、访问令牌或私密密钥。

## 1. 当前产品方向

这个仓库不只是个人介绍页，还包含长期使用的个人工具。

当前设计原则：

1. 主页保持浅色、墨绿色点缀、简约清晰。
2. 避免深色霓虹、玻璃拟态、渐变光效和“很多圆角卡片”的 AI landing page 风格。
3. 项目按用途排列，用目录式分割线呈现，不重复堆叠 Projects 与 Tools。
4. Money/Tax 的真实数据绝不能作为默认值写进公开源码。
5. 未登录用户只看到模板；登录用户只看到自己的云端数据。

## 2. 当前文件与职责

### 公共页面

- `index.html`：主页，CSS 内嵌，只有少量移动导航脚本。
- `device.html`：设备与订阅记录。
- `PhD.html`：长期情景建模。
- `blog.html`、`blog/`：博客入口和旧博客系统。
- `obsidian/`、`MkDocs/site/`、`Archive/`：静态内容与历史归档。

### 财务页面

- `money.html`：资产、未来现金流、预算、情景和贷款。
- `tax.html`：年度个税汇算测算。
- `cloud-sync.js`：Money/Tax 共用的 GitHub 登录和 Supabase 同步层。
- `cloud-config.js`：公开的 Supabase URL、Publishable key、所有者 GitHub 登录名。
- `supabase-setup.sql`：表、权限和 RLS 策略。
- `CLOUD_SETUP.md`：控制台配置、备份、恢复和故障排查。

## 3. 主页设计记录

主页在提交 `423a534` 中完成重构。

视觉规范：

- 背景：暖白 `#f5f4ee`。
- 正文：近黑绿 `#18211c`。
- 点缀：墨绿色 `#184d36`。
- 分割线：`#d7d9d2`。
- 英文大标题使用 Georgia；中文和正文使用系统字体与本地霞鹜文楷回退。
- 内容最大宽度 1120px。
- 首屏由个人介绍和 Current focus 两列构成。
- Work 使用横向目录条目，不使用卡片容器。
- About 使用唯一的大面积墨绿色区块，形成页面收束。

维护主页时应优先减少层级，而不是增加装饰。新增项目时复制 `.work-item`，保持编号连续。

## 4. Money 页面模型

`money.html` 的状态对象主要包含：

- `rate`：美元兑人民币汇率。
- `current[]`：当前资产。
- `future[]`：预计收入。
- `budget[]`：计划支出。
- `rows[]`：资产构成、预算、情景和贷款行。

贷款行使用：

- `totalAmount`：贷款总额。
- `totalPeriods`：总期数。
- `paidPeriods`：已还期数。

派生值：

```text
月供 = 总额 ÷ 总期数
剩余期数 = 总期数 − 已还期数
已还金额 = 月供 × 已还期数
剩余金额 = 月供 × 剩余期数
```

贷款主条展示现金流覆盖情况；下方细进度条展示已还期数与百分比。Current 与 Forecast 使用两条独立虚线，与其他预算/现金流基准对齐。

公开默认数据位于 `defaultState`，必须始终保持脱敏。Money 当前遗留 key 为 `szy_finance_demo_v2_sanitized`。

## 5. Tax 页面模型

`tax.html` 使用年度账本结构：

```text
book
├── activeYear
├── years
│   └── YYYY
│       ├── incomes[]
│       └── deductions
└── migrations
```

每笔收入包含：

- 状态：已发生 `confirmed` / 预计 `projected`。
- 期间、来源、所得类型、备注。
- 申报收入 `gross`。
- 预缴税额 `prepaid`。
- 实际到手 `received`：默认按 `gross - prepaid`，也可手动校准。

所得类型：工资薪金、劳务报酬、稿酬、特许权使用费。

年度链路：

```text
申报收入
→ 按所得类型折算综合所得收入额
→ 减基本/专项/专项附加/其他扣除和捐赠
→ 全年应纳税所得额
→ 年度最终税额
→ 减预缴税额
→ 预计退税或补税
```

页面还展示：

- 全年实际到手合计，不含退税。
- 实际到手加退税后的汇算后总额。
- 年度最终税额按每笔年度收入额占比分摊后的“分摊应缴”。
- `分摊差额 = 实际预缴 − 分摊应缴`：红色表示多缴，绿色表示少缴。该值只用于分析，不是法定月度税额。
- 可拖动并记忆表格列宽。
- 年度扣除项目默认折叠。

Tax 数据 key：`szy_tax_refund_planner_v2`。列宽仅保存在本机 `szy_tax_column_widths_v1`，不属于财务数据。

## 6. 云同步架构

### 登录与路由

1. 页面加载 Supabase JS、`cloud-config.js` 和 `cloud-sync.js`。
2. 未登录时应用脱敏模板。
3. 点击“GitHub 登录”后，经 GitHub OAuth 返回 Supabase callback。
4. Supabase 恢复会话后按当前用户 ID 查询数据。
5. Money 与 Tax 分别使用 `document_type = money` 和 `document_type = tax`。

### 数据表

`public.user_documents` 的主键为 `(user_id, document_type)`：

```text
user_id       auth.users.id
document_type money | tax
payload       jsonb
updated_at    timestamptz
```

RLS 强制所有 select/insert/update/delete 都满足 `auth.uid() = user_id`。匿名角色没有表权限。

### 保存行为

- 用户修改数据后调用 `scheduleSave`，650ms 防抖后 upsert。
- 手动同步调用 `saveNow`。
- 未登录时不会保存财务数据，只显示模板。
- 每个 GitHub 用户拥有独立行；其他账号不会看到所有者数据。

### 加密边界

- 网络传输使用 HTTPS。
- Supabase 提供数据库静态加密与平台备份。
- 当前不是客户端端到端加密：Supabase 项目管理员仍具备数据库管理能力。
- 如果以后要求“平台管理员也看不到明文”，需要增加用户侧密钥和客户端加密，不能只依赖 RLS。

## 7. 数据事故与恢复状态

### 发生了什么

2026-08-04 为避免真实财务数据继续存在于公开 Git 历史，执行了安全历史重置：

- `4b85da0`：新的安全根提交，公开默认数据改为模板。
- `0569bea`：写入 Supabase 公开配置并启用线上云同步。

历史重置后，原来写在旧版 Tax 默认值中的个人账本不再出现在远端可达历史中，但本机 Git 对象仍可恢复。旧数据在本机旧提交 `cb50d4b` 的 `tax.html` 中被找回。

首次云端初始化出现了一个重要问题：如果云端已经存在模板行，`cloud-sync.js` 会优先读取远端 payload，不再尝试迁移旧 localStorage。因此模板可能覆盖用户对“数据已迁移”的预期。

Money 还有额外风险：当前 `legacyStorageKey` 是新的脱敏 key，而不是旧版真实数据使用的 key，因此不能假定旧 Money localStorage 会自动迁移。

### 当前恢复状态

- 旧 Tax 账本已从本机 Git 对象提取为一次性恢复 JSON。
- 恢复文件只在本机临时目录，未提交到公开仓库：
  `C:\Users\szy\AppData\Local\Temp\szy-tax-recovery-2026-2027.json`
- 截至本文件更新时间，该恢复文件尚未确认导入 Supabase 用户行。
- 恢复必须在所有者 GitHub 会话登录后，通过 Tax 页“导入”完成并确认右下角显示“已同步”。

不要把恢复 JSON 加入 Git。完成恢复后应先导出一份用户自行保管的备份，再删除临时文件。

## 8. 下次继续时的优先事项

1. 完成 Tax 恢复：用 `AWSzyAI` 登录 Tax 页面，导入临时恢复 JSON，检查 2026/2027 年份和汇总结果，等待云端同步。
2. 立刻从 Tax 页“导出 JSON”保存新的私有备份。
3. 检查 Money 是否仍能在原浏览器找到旧数据；不要在未备份前反复刷新或清理浏览器数据。
4. 改进首次迁移策略：当远端只有模板时，提供明确的“导入旧本机数据/保留云端模板”选择，禁止静默覆盖。
5. 为 Money 与 Tax 增加可见的“最近云端保存时间”和手动导出提醒。

## 9. 安全操作规则

- 公开仓库中只能存在脱敏模板。
- 不提交 JSON 备份、截图中的真实金额、access token、refresh token、GitHub Client Secret 或 Supabase `service_role` key。
- `cloud-config.js` 只允许 Project URL 和 Publishable key。
- 修改 `supabase-setup.sql` 后必须重新验证匿名读取被拒绝、不同账号互相不可见。
- 在删除 localStorage 前，必须确认云端写入成功并能在刷新后重新读取。
- 历史重写只用于清除已公开的敏感信息；执行前要保留本地恢复点。

## 10. 开发与验证流程

### 本地检查

```powershell
git diff --check
node --check cloud-config.js
node --check cloud-sync.js
python -m http.server 4173
```

浏览器检查：

- 主页桌面与移动布局无横向溢出。
- 所有导航和项目链接有效。
- Money/Tax 未登录时只显示模板。
- 登录后状态显示 GitHub 用户名与“已同步”。
- 修改数据、等待自动保存、刷新后数据仍存在。
- 用第二个账号登录时只能看到该账号自己的模板或数据。

### 部署检查

```powershell
git push origin main
gh run list --limit 5 --json status,conclusion,headSha,url
```

GitHub Pages 成功后，用带查询参数的地址绕过浏览器缓存：

```text
https://awszyai.github.io/?deploy=<commit>
```

## 11. 关键提交

| 提交 | 含义 |
| --- | --- |
| `423a534` | 主页改为浅色、墨绿色、目录式简约设计 |
| `0569bea` | 配置 Supabase 云同步 |
| `4b85da0` | 安全重置公开历史，移除真实财务默认数据 |
| `cb50d4b` | 本机仍可访问的旧 Tax 实现与恢复来源，不应重新推到公开远端 |

## 12. 下次会话建议开场

可以直接告诉维护者：

> 请先阅读仓库根目录的 `PROJECT_MEMORY.md` 和 `CLOUD_SETUP.md`。先检查 Tax 恢复是否完成，再做其他财务页面改动。不要把本机恢复 JSON 或真实金额提交到 Git。

