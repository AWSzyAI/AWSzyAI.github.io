#!/usr/bin/env node
// awszyai.github.io/device 的只读 MCP 服务器（stdio）。
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadDevice } from './source.mjs';
import * as q from './queries.mjs';

const server = new McpServer({ name: 'szy-device', version: '0.1.0' }, {
    instructions: [
        '读取用户在 https://awszyai.github.io/device 记录的个人数据：资产(asset)、订阅(sub)、租赁(rental，含「租车」「租房」和 kind=loan 的「车贷」)、打卡(checkin)、每日账目(ledger)。',
        '只读。金额单位人民币（订阅可能是美元，见 currency）。日期均为北京时间 YYYY-MM-DD，记录使用期是 [start, end)。',
        '这是用户的私人财务数据：只在用户提问的范围内引用，不要发到外部服务。',
    ].join('\n'),
});

const json = value => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '格式 YYYY-MM-DD');
const readOnly = { readOnlyHint: true, openWorldHint: false };

function tool(name, title, description, inputSchema, run) {
    server.registerTool(name, { title, description, inputSchema, annotations: { ...readOnly, title } }, async args => {
        try {
            const doc = await loadDevice({ reload: Boolean(args?.reload) });
            return json(run(doc, args || {}));
        } catch (err) {
            return { isError: true, content: [{ type: 'text', text: String(err.message || err) }] };
        }
    });
}

tool('device_status', '数据来源与概况',
    '数据来自哪里（云端或本地备份）、最后更新时间、各类项目数量和账目覆盖的日期。reload=true 强制重新读取。',
    { reload: z.boolean().optional() },
    doc => q.status(doc));

tool('list_items', '列出项目',
    '列出 device 页面的项目。type 可选 asset（实物资产）、sub（订阅）、rental（租赁/车贷）、checkin（打卡）；activeOnly 只看当前进行中的。',
    { type: z.enum(['asset', 'sub', 'rental', 'checkin']).optional(), activeOnly: z.boolean().optional() },
    ({ payload }, a) => q.listItems(payload, a));

tool('get_item', '项目详情',
    '按名称取一个项目的完整数据（含全部周期记录）。名称可以是完整名或唯一的部分名，如「车贷」「iCloud」。',
    { name: z.string() },
    ({ payload }, a) => q.getItem(payload, a.name));

tool('rentals', '租赁记录（默认租车）',
    '某个租赁项目的订单明细与汇总：天数、金额、日均、里程与每公里成本、按年合计。默认「租车」，也可传「租房」「租显卡」等。会跳过起止日期和金额完全相同的重复条目并列出来。',
    { name: z.string().optional(), from: date.optional(), to: date.optional() },
    ({ payload }, a) => q.rentals(payload, a));

tool('car_loan', '车贷进度',
    '车贷参数、月供、已还/剩余期数与金额、下一次还款日（按北京时间今天计算）。',
    {},
    ({ payload }) => q.carLoan(payload));

tool('ledger', '每日账目',
    '按日期区间列出每日账目（支出/收入行，名称是分类，银行原文在 note），可按分类过滤，如「汽车充电」「停车费」「吃饭」。',
    { from: date.optional(), to: date.optional(), category: z.string().optional() },
    ({ payload }, a) => q.ledgerRows(payload, a));

tool('spending_summary', '区间收支汇总',
    '某段日期（含首尾）的收支汇总：每日账目按分类合计，加上订阅、租赁、车贷按天摊销到这段时间的金额，以及结余。',
    { from: date, to: date },
    ({ payload }, a) => q.spendingSummary(payload, a));

tool('checkins', '打卡记录',
    '打卡项目（如「上班」）在某段时间内的记录。',
    { name: z.string().optional(), from: date.optional(), to: date.optional() },
    ({ payload }, a) => q.checkins(payload, a));

await server.connect(new StdioServerTransport());
