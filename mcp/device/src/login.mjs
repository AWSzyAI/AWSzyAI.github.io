#!/usr/bin/env node
// 用 GitHub 登录 Supabase，把会话存到 ~/.config/szy-device-mcp/auth.json（0600）。
// 账号密码只在 GitHub 官方页面由用户本人输入，本脚本只接收回调里的一次性 code。
//   npm run login            登录
//   npm run login -- --status 查看登录状态
//   npm run logout           删除本机会话
import http from 'node:http';
import { execFile } from 'node:child_process';
import { supabaseClient, logout, hasSession, CONFIG_DIR } from './source.mjs';

const PORT = Number(process.env.DEVICE_MCP_LOGIN_PORT || 53682);
const REDIRECT = `http://localhost:${PORT}/callback`;
const args = process.argv.slice(2);

if (args.includes('--logout')) {
    logout();
    console.log('已删除本机登录会话。');
    process.exit(0);
}

const client = supabaseClient();

if (args.includes('--status')) {
    if (!hasSession()) { console.log('未登录。'); process.exit(1); }
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session) { console.log(`会话无效：${error?.message || '无'}`); process.exit(1); }
    const u = session.user;
    console.log(`已登录：${u.user_metadata?.user_name || u.email}，access token 有效期至 ${new Date(session.expires_at * 1000).toLocaleString('zh-CN')}（会自动续期）`);
    process.exit(0);
}

const { data, error } = await client.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: REDIRECT, skipBrowserRedirect: true },
});
if (error) { console.error(`无法发起登录：${error.message}`); process.exit(1); }

const done = new Promise((resolve, reject) => {
    const srv = http.createServer(async (req, res) => {
        const url = new URL(req.url, REDIRECT);
        if (url.pathname !== '/callback') { res.writeHead(404).end(); return; }
        const code = url.searchParams.get('code');
        const err = url.searchParams.get('error_description') || url.searchParams.get('error');
        const page = (title, body) => `<!doctype html><meta charset="utf-8"><title>${title}</title><body style="font:16px system-ui;padding:40px"><h2>${title}</h2><p>${body}</p>`;
        if (!code) {
            res.writeHead(400, { 'content-type': 'text/html; charset=utf-8' }).end(page('登录失败', err || '回调里没有 code'));
            srv.close(); reject(new Error(err || '回调里没有 code')); return;
        }
        const { data: ex, error: exErr } = await client.auth.exchangeCodeForSession(code);
        if (exErr) {
            res.writeHead(400, { 'content-type': 'text/html; charset=utf-8' }).end(page('登录失败', exErr.message));
            srv.close(); reject(exErr); return;
        }
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(page('登录成功', '可以关闭这个页面，回到终端。'));
        srv.close(); resolve(ex.session);
    });
    srv.listen(PORT, '127.0.0.1');
    setTimeout(() => { srv.close(); reject(new Error('5 分钟内没有收到回调')); }, 5 * 60_000).unref();
});

console.log(`在浏览器里完成 GitHub 登录（回调地址 ${REDIRECT}）。`);
console.log('如果登录后跳回了 awszyai.github.io 而不是本机，说明 Supabase 的 Redirect URLs 还没加上面这个回调地址，见 README。');
execFile('open', [data.url], () => {});
console.log(`没有自动打开的话，手动访问：\n${data.url}\n`);

try {
    const session = await done;
    const u = session.user;
    console.log(`已登录：${u.user_metadata?.user_name || u.email}。会话保存在 ${CONFIG_DIR}/auth.json`);
    process.exit(0);
} catch (e) {
    console.error(`登录失败：${e.message}`);
    process.exit(1);
}
