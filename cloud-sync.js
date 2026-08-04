(function () {
    const config = window.SZY_CLOUD_CONFIG || {};
    let client = null;
    let context = null;
    let session = null;
    let saveTimer = null;
    let authSubscription = null;

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function isConfigured() {
        return Boolean(config.supabaseUrl && config.supabasePublishableKey && window.supabase?.createClient);
    }

    function githubLogin(user) {
        return String(user?.user_metadata?.user_name || user?.user_metadata?.preferred_username || '').toLowerCase();
    }

    function mountStatus() {
        if (document.getElementById('szy-cloud-auth')) return;
        const style = document.createElement('style');
        style.textContent = `
            .szy-cloud-auth{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid rgba(120,128,140,.3);border-radius:12px;background:rgba(255,255,255,.94);box-shadow:0 8px 28px rgba(20,28,38,.16);color:#252a31;font:600 11px/1.2 system-ui,sans-serif;backdrop-filter:blur(12px)}
            .szy-cloud-auth button{min-height:28px;padding:0 10px;border:1px solid #cfd5dd;border-radius:8px;background:#fff;color:#252a31;font:700 11px system-ui,sans-serif;cursor:pointer}
            .szy-cloud-auth button:hover{border-color:#4285f4}.szy-cloud-auth .danger:hover{border-color:#d84b4b;color:#b72f2f}
            .szy-cloud-dot{width:7px;height:7px;border-radius:50%;background:#9aa1ab}.szy-cloud-dot.online{background:#20a464}.szy-cloud-dot.error{background:#d84b4b}
            @media(max-width:720px){.szy-cloud-auth{right:10px;bottom:10px;max-width:calc(100vw - 20px)}}`;
        document.head.appendChild(style);
        const auth = document.createElement('div');
        auth.id = 'szy-cloud-auth';
        auth.className = 'szy-cloud-auth';
        auth.innerHTML = '<span class="szy-cloud-dot"></span><span data-cloud-status>正在检查登录状态</span><button data-cloud-login type="button">GitHub 登录</button><button class="danger" data-cloud-logout type="button" hidden>退出</button>';
        auth.querySelector('[data-cloud-login]').addEventListener('click', signIn);
        auth.querySelector('[data-cloud-logout]').addEventListener('click', signOut);
        document.body.appendChild(auth);
    }

    function setStatus(message, state = 'idle', signedIn = Boolean(session)) {
        const root = document.getElementById('szy-cloud-auth');
        if (!root) return;
        root.querySelector('[data-cloud-status]').textContent = message;
        root.querySelector('.szy-cloud-dot').className = `szy-cloud-dot ${state === 'online' ? 'online' : state === 'error' ? 'error' : ''}`;
        root.querySelector('[data-cloud-login]').hidden = signedIn || !isConfigured();
        root.querySelector('[data-cloud-logout]').hidden = !signedIn;
    }

    async function signIn() {
        if (!isConfigured()) return;
        setStatus('正在跳转到 GitHub…');
        const { error } = await client.auth.signInWithOAuth({
            provider: 'github',
            options: { redirectTo: `${location.origin}${location.pathname}` }
        });
        if (error) setStatus(`登录失败：${error.message}`, 'error');
    }

    async function signOut() {
        if (!client) return;
        await client.auth.signOut();
    }

    async function readDocument() {
        const { data, error } = await client
            .from('user_documents')
            .select('payload, updated_at')
            .eq('document_type', context.documentType)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    async function writeDocument(payload) {
        if (!session) return false;
        const { error } = await client.from('user_documents').upsert({
            user_id: session.user.id,
            document_type: context.documentType,
            payload: clone(payload),
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,document_type' });
        if (error) throw error;
        return true;
    }

    async function loadForSession(nextSession) {
        session = nextSession;
        if (!session) {
            context.applyData(clone(context.template));
            setStatus('模板模式 · 登录后自动同步', 'idle', false);
            return;
        }
        setStatus('正在读取云端数据…', 'idle', true);
        try {
            const remote = await readDocument();
            if (remote?.payload) {
                context.applyData(remote.payload);
            } else {
                const isOwner = githubLogin(session.user) === String(config.ownerGithubLogin || '').toLowerCase();
                const legacyRaw = isOwner ? localStorage.getItem(context.legacyStorageKey) : null;
                let initial = clone(context.template);
                if (legacyRaw) {
                    try { initial = JSON.parse(legacyRaw); } catch (error) { /* use template */ }
                }
                context.applyData(initial);
                await writeDocument(context.getData());
                if (legacyRaw) localStorage.removeItem(context.legacyStorageKey);
            }
            setStatus(`${githubLogin(session.user) || 'GitHub 用户'} · 已同步`, 'online', true);
        } catch (error) {
            setStatus(`同步失败：${error.message}`, 'error', true);
        }
    }

    async function init(options) {
        context = options;
        mountStatus();
        context.applyData(clone(context.template));
        if (!isConfigured()) {
            setStatus('模板模式 · 云同步待配置');
            return;
        }
        client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        const { data, error } = await client.auth.getSession();
        if (error) {
            setStatus(`认证失败：${error.message}`, 'error');
            return;
        }
        await loadForSession(data.session);
        const listener = client.auth.onAuthStateChange((event, nextSession) => {
            if (event === 'INITIAL_SESSION') return;
            queueMicrotask(() => loadForSession(nextSession));
        });
        authSubscription = listener.data.subscription;
    }

    function scheduleSave(payload) {
        if (!session || !client) return;
        clearTimeout(saveTimer);
        setStatus('正在保存…', 'idle', true);
        saveTimer = setTimeout(async () => {
            try {
                await writeDocument(payload);
                setStatus(`${githubLogin(session.user) || 'GitHub 用户'} · 已同步`, 'online', true);
            } catch (error) {
                setStatus(`保存失败：${error.message}`, 'error', true);
            }
        }, 650);
    }

    async function saveNow(payload) {
        if (!session || !client) return false;
        clearTimeout(saveTimer);
        await writeDocument(payload);
        setStatus(`${githubLogin(session.user) || 'GitHub 用户'} · 已同步`, 'online', true);
        return true;
    }

    function isSignedIn() {
        return Boolean(session);
    }

    window.SzyCloud = { init, scheduleSave, saveNow, isConfigured, isSignedIn };
})();
