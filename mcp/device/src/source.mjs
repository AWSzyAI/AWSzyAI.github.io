// 数据来源：优先读 Supabase 云端文档（需要先 `npm run login`），否则退回本地「Export All」备份。
// 登录会话只存在本机 ~/.config/szy-device-mcp/，不进仓库。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const CONFIG_DIR = process.env.DEVICE_MCP_CONFIG_DIR || path.join(os.homedir(), '.config', 'szy-device-mcp');
const AUTH_FILE = path.join(CONFIG_DIR, 'auth.json');
const DOCUMENT_TYPE = 'device';

// 与网页共用同一份公开配置（Supabase URL 与 publishable key）
export function cloudConfig() {
    const file = path.resolve(HERE, '../../../cloud-config.js');
    const text = fs.readFileSync(file, 'utf8');
    const pick = key => (text.match(new RegExp(`${key}:\\s*'([^']+)'`)) || [])[1];
    return { url: pick('supabaseUrl'), key: pick('supabasePublishableKey'), owner: pick('ownerGithubLogin') };
}

// supabase-js 的 storage 接口，落盘到 0600 的 JSON 文件
const fileStorage = {
    read() {
        try { return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')); } catch { return {}; }
    },
    write(all) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
        fs.writeFileSync(AUTH_FILE, JSON.stringify(all), { mode: 0o600 });
        fs.chmodSync(AUTH_FILE, 0o600);
    },
    getItem(key) { return this.read()[key] ?? null; },
    setItem(key, value) { const all = this.read(); all[key] = value; this.write(all); },
    removeItem(key) { const all = this.read(); delete all[key]; this.write(all); },
};

export function supabaseClient() {
    const { url, key } = cloudConfig();
    return createClient(url, key, {
        auth: {
            storage: {
                getItem: k => fileStorage.getItem(k),
                setItem: (k, v) => fileStorage.setItem(k, v),
                removeItem: k => fileStorage.removeItem(k),
            },
            persistSession: true,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            flowType: 'pkce',
        },
    });
}

export function hasSession() {
    return fs.existsSync(AUTH_FILE) && Object.keys(fileStorage.read()).some(k => k.endsWith('-auth-token'));
}

export function logout() {
    if (fs.existsSync(AUTH_FILE)) fs.rmSync(AUTH_FILE);
}

function newestBackup() {
    if (process.env.DEVICE_MCP_FILE) return process.env.DEVICE_MCP_FILE;
    const dir = process.env.DEVICE_MCP_BACKUP_DIR;
    if (!dir || !fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir).filter(f => /^all_assets_.*\.json$/.test(f)).sort();
    return files.length ? path.join(dir, files[files.length - 1]) : null;
}

async function readCloud() {
    const client = supabaseClient();
    const { data: { session }, error } = await client.auth.getSession();   // 过期时会用 refresh token 自动续期并写回文件
    if (error) throw new Error(`登录状态无效：${error.message}。请重新运行 npm run login`);
    if (!session) throw new Error('还没有登录。请在 mcp/device 目录运行 npm run login');
    const { data, error: qErr } = await client
        .from('user_documents')
        .select('payload, updated_at')
        .eq('document_type', DOCUMENT_TYPE)
        .maybeSingle();
    if (qErr) throw new Error(`读取云端失败：${qErr.message}`);
    if (!data?.payload) throw new Error('云端没有 device 文档');
    const login = session.user?.user_metadata?.user_name || session.user?.user_metadata?.preferred_username || '';
    return { payload: data.payload, source: `cloud (${login || session.user.email || 'GitHub'})`, updatedAt: data.updated_at };
}

function readFile(file) {
    const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { payload, source: `backup file ${path.basename(file)}`, updatedAt: payload.exportedAt || fs.statSync(file).mtime.toISOString() };
}

let cache = null;
const TTL_MS = 60_000;

// mode: auto（默认，云端优先，失败时退回备份并附上原因）| cloud | file
export async function loadDevice({ reload = false } = {}) {
    if (!reload && cache && Date.now() - cache.at < TTL_MS) return cache.value;
    const mode = process.env.DEVICE_MCP_SOURCE || 'auto';
    let value, cloudError = null;
    if (mode !== 'file') {
        try {
            value = await readCloud();
        } catch (err) {
            if (mode === 'cloud') throw err;
            cloudError = err.message;
        }
    }
    if (!value) {
        const file = newestBackup();
        if (!file) throw new Error(`没有可用的数据来源。${cloudError ? `云端：${cloudError}。` : ''}可设置 DEVICE_MCP_FILE 或 DEVICE_MCP_BACKUP_DIR 指向「Export All」备份`);
        value = { ...readFile(file), cloudError };
    }
    cache = { at: Date.now(), value };
    return value;
}
