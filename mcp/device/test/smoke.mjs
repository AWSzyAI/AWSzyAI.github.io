// 冒烟测试：启动服务器，调用每个工具，只打印是否成功和结果大小（不打印真实数据）。
// 用法：DEVICE_MCP_SOURCE=file DEVICE_MCP_FILE=<备份.json> npm test
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({ command: process.execPath, args: [new URL('../src/server.mjs', import.meta.url).pathname], env: process.env });
const client = new Client({ name: 'smoke', version: '0' });
await client.connect(transport);
const { tools } = await client.listTools();
console.log('tools:', tools.map(t => t.name).join(', '));
const calls = [
    ['device_status', {}], ['list_items', { type: 'sub', activeOnly: true }], ['get_item', { name: '车贷' }],
    ['rentals', {}], ['car_loan', {}], ['ledger', { from: '2026-10-01', to: '2026-10-31', category: '汽车充电' }],
    ['spending_summary', { from: '2026-10-01', to: '2026-10-31' }], ['checkins', { name: '上班' }], ['car_diary', { onlyThin: true }],
    ['get_item', { name: '不存在的项目' }], ['spending_summary', { from: '10/01' }],
];
let failed = 0;
for (const [name, args] of calls) {
    const r = await client.callTool({ name, arguments: args });
    const text = r.content?.[0]?.text || '';
    const expectError = name === 'get_item' && args.name === '不存在的项目' || args.from === '10/01';
    const ok = expectError ? r.isError : !r.isError;
    if (!ok) failed++;
    console.log(`${ok ? 'ok ' : 'BAD'} ${name} ${JSON.stringify(args)} → ${r.isError ? 'error: ' + text.slice(0, 80) : text.length + ' chars'}`);
}
await client.close();
process.exit(failed ? 1 : 0);
