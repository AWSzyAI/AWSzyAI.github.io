#!/usr/bin/env node
// 把本机从 TeslaMate 生成的每日行程摘要（carlog.json）写进云端 device 文档，供「日记」页参考。
//   npm run push-carlog -- <carlog.json> [--dry-run]
// 规则（与私有「支出」项目一致）：先备份到 DEVICE_MCP_BACKUP_DIR；只替换机器生成的 carLog，
// 打卡项目「开车」只给还没有记录的日期补上当天公里数，不改动已有记录和任何备注。
import fs from 'node:fs';
import path from 'node:path';
import { supabaseClient } from './source.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
    console.error('用法：npm run push-carlog -- <carlog.json> [--dry-run]');
    process.exit(1);
}
const backupDir = process.env.DEVICE_MCP_BACKUP_DIR;
if (!dryRun && (!backupDir || !fs.existsSync(backupDir))) {
    console.error('写入前必须先备份：请把 DEVICE_MCP_BACKUP_DIR 设为备份目录');
    process.exit(1);
}

const carLog = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!carLog?.days || typeof carLog.days !== 'object') {
    console.error('文件里没有 days');
    process.exit(1);
}

const client = supabaseClient();
const { data: { session } } = await client.auth.getSession();
if (!session) {
    console.error('还没有登录：先运行 npm run login');
    process.exit(1);
}

async function readDoc() {
    const { data, error } = await client.from('user_documents').select('payload, updated_at')
        .eq('document_type', 'device').maybeSingle();
    if (error) throw error;
    if (!data?.payload?.items) throw new Error('云端没有 device 文档');
    return data;
}

const doc = await readDoc();
const payload = structuredClone(doc.payload);

let drive = payload.items.find((i) => i.type === 'checkin' && i.name === '开车');
let created = false;
if (!drive) {
    drive = { id: Date.now(), type: 'checkin', name: '开车', checkinType: 'km', isCount: false, presets: '', defaultDuration: '',
              records: {}, todos: [], reminderDays: 30 };
    payload.items.push(drive);
    created = true;
}
drive.records = drive.records || {};
let added = 0;
for (const [date, day] of Object.entries(carLog.days)) {
    if (drive.records[date] !== undefined || !(day.km > 0)) continue;
    drive.records[date] = Math.round(day.km * 10) / 10;
    added++;
}
const oldDays = Object.keys(payload.carLog?.days || {}).length;
payload.carLog = { generatedAt: carLog.generatedAt, source: carLog.source || 'TeslaMate', days: carLog.days };
payload.exportedAt = new Date().toISOString();

console.log(`carLog：${oldDays} 天 → ${Object.keys(carLog.days).length} 天；「开车」${created ? '新建，' : ''}补上 ${added} 天的公里数`);
if (dryRun) {
    console.log('--dry-run：没有写入');
    process.exit(0);
}

const stamp = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '_');
const backup = path.join(backupDir, `all_assets_${stamp}_before-carlog.json`);
fs.writeFileSync(backup, JSON.stringify(doc.payload, null, 2));
console.log(`已备份：${backup}`);

// 写入前再确认一次云端没有被别处改过，避免覆盖刚保存的编辑
const latest = await readDoc();
if (latest.updated_at !== doc.updated_at) {
    console.error('云端在这期间被修改过（可能 device 页面刚保存），没有写入。请重新运行。');
    process.exit(1);
}
const { error } = await client.from('user_documents').upsert({
    user_id: session.user.id, document_type: 'device', payload, updated_at: new Date().toISOString(),
}, { onConflict: 'user_id,document_type' });
if (error) {
    console.error(`写入失败：${error.message}`);
    process.exit(1);
}
console.log('已写入云端。已经打开的 device 页面请刷新，否则它下次保存会带着旧的 carLog。');
