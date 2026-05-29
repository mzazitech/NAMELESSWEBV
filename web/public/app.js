// ─── DARKNODE BOT — frontend (Clerk auth) ─────────────────────────────
let clerk = null;
let pollHandle = null;

const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function show(view) {
    $$('.view').forEach(v => v.classList.add('hidden'));
    const el = $('#view-' + view);
    if (el) el.classList.remove('hidden');
}

async function api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (clerk?.session) {
        try {
            const token = await clerk.session.getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
    }
    const r = await fetch(path, { ...opts, headers });
    let data = null;
    try { data = await r.json(); } catch {}
    if (!r.ok) throw new Error(data?.error || ('HTTP ' + r.status));
    return data;
}

// ─── Bootstrap: load Clerk SDK using publishable key from /api/config ───
async function bootClerk() {
    const cfg = await fetch('/api/config').then(r => r.json());
    const pk  = cfg.clerkPublishableKey;
    if (!pk) {
        document.body.innerHTML = `<div style="padding:40px;font-family:system-ui;color:#fff;background:#0e1116;height:100vh">
            <h1 style="color:#e74c3c">Clerk is not configured</h1>
            <p>Set <code>CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code> in your environment, then redeploy.</p>
            <p>Get them from <a href="https://dashboard.clerk.com" style="color:#5b9cff">dashboard.clerk.com</a> → API Keys.</p>
        </div>`;
        throw new Error('Missing CLERK_PUBLISHABLE_KEY');
    }
    // Determine the Clerk Frontend API host from the publishable key
    // (publishable keys are base64-encoded `<frontend-host>$`)
    let host;
    try {
        host = atob(pk.replace(/^pk_(test|live)_/, '')).replace(/\$$/, '');
    } catch {
        document.body.innerHTML = `<div style="padding:40px;font-family:system-ui;color:#fff;background:#0e1116;min-height:100vh">
            <h1 style="color:#e74c3c">Clerk key is not valid</h1>
            <p>The <code>CLERK_PUBLISHABLE_KEY</code> secret doesn't look like a real Clerk key.</p>
            <p>It must start with <code>pk_test_</code> (development) or <code>pk_live_</code> (production).</p>
            <p>Get the correct key from <a href="https://dashboard.clerk.com" target="_blank" style="color:#5b9cff">dashboard.clerk.com</a> → API Keys, then update the secret in Replit.</p>
        </div>`;
        throw new Error('Invalid CLERK_PUBLISHABLE_KEY — cannot decode host');
    }

    await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = `https://${host}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
        s.async = true;
        s.crossOrigin = 'anonymous';
        s.setAttribute('data-clerk-publishable-key', pk);
        s.onload = resolve;
        s.onerror = () => reject(new Error('Failed to load Clerk JS from ' + s.src));
        document.head.appendChild(s);
    });

    // Clerk JS v5+ auto-initialises and exposes itself on window.Clerk directly.
    // Wait a tick to let the script finish its own async init if needed.
    await new Promise(r => setTimeout(r, 100));
    clerk = window.Clerk;
    if (!clerk) throw new Error('Clerk SDK did not initialise on window.Clerk');
    await clerk.load({});
    clerk.addListener(handleClerkChange);
    handleClerkChange();
}

// ─── React to Clerk auth changes ───
function handleClerkChange() {
    const signedIn = !!clerk?.user;
    if (signedIn) {
        $('#nav-signin').classList.add('hidden');
        $('#nav-signup').classList.add('hidden');
        $('#nav-user').textContent = clerk.user.primaryEmailAddress?.emailAddress || clerk.user.id;
        $('#nav-user').classList.remove('hidden');
        // Mount the Clerk user button
        const mount = $('#user-button-mount');
        mount.innerHTML = '';
        clerk.mountUserButton(mount, { afterSignOutUrl: '/' });
        loadDashboard();
    } else {
        $('#nav-signin').classList.remove('hidden');
        $('#nav-signup').classList.remove('hidden');
        $('#nav-user').classList.add('hidden');
        $('#user-button-mount').innerHTML = '';
        stopPolling();
        show('landing');
        loadStats();
    }
}

// ─── Auth UI mounts ───
function openSignIn() {
    show('login');
    const mount = $('#clerk-signin-mount');
    mount.innerHTML = '';
    clerk.mountSignIn(mount, { afterSignInUrl: '/', afterSignUpUrl: '/' });
}
function openSignUp() {
    show('signup');
    const mount = $('#clerk-signup-mount');
    mount.innerHTML = '';
    clerk.mountSignUp(mount, { afterSignInUrl: '/', afterSignUpUrl: '/' });
}

// ─── Stats (public) ───
async function loadStats() {
    try {
        const s = await fetch('/api/stats').then(r => r.json());
        $('#stat-users').textContent = s.totalUsers ?? '—';
        $('#stat-active').textContent = s.activeBots ?? '—';
    } catch {}
}

// ─── Dashboard ───
async function loadDashboard() {
    show('dashboard');
    try {
        const me = await api('/api/auth/me');
        if (!me?.user) return;
        fillSettings(me.user);
        startPolling();
    } catch (e) {
        console.error('me failed:', e?.message);
    }
}

function fillSettings(u) {
    const f = $('#form-settings');
    f.botName.value     = u.settings?.botName || '';
    f.prefix.value      = u.settings?.prefix  || '.';
    f.pairingName.value = u.settings?.pairingName || 'DARKNODE';
    f.public.checked     = u.settings?.public !== false;
    f.autoRead.checked   = !!u.settings?.autoRead;
    f.autoTyping.checked = !!u.settings?.autoTyping;
    f.chatbot.checked    = !!u.settings?.chatbot;
    f.owners.value       = (u.owners || []).join(', ');
}

async function refreshStatus() {
    try {
        const s = await api('/api/bot/status');
        const pill = $('#status-pill');
        pill.textContent = s.status || 'offline';
        pill.className = 'pill ' + (s.status || 'offline');
        $('#status-phone').textContent   = s.phone || '—';
        $('#status-started').textContent = s.startedAt ? new Date(s.startedAt).toLocaleString() : '—';
        if (s.pairingCode) {
            $('#pairing-display').classList.remove('hidden');
            $('#pairing-code').textContent = s.pairingCode;
        } else if (s.status === 'connected') {
            $('#pairing-display').classList.add('hidden');
        }
    } catch (e) {
        if (String(e.message).includes('401')) stopPolling();
    }
}

function startPolling() {
    stopPolling();
    refreshStatus();
    pollHandle = setInterval(refreshStatus, 3000);
}
function stopPolling() {
    if (pollHandle) clearInterval(pollHandle);
    pollHandle = null;
}

// ─── Wire up DOM ───
function wire() {
    document.addEventListener('click', (e) => {
        const a = e.target.closest('[data-clerk]');
        if (!a) return;
        e.preventDefault();
        if (a.dataset.clerk === 'signin') openSignIn();
        if (a.dataset.clerk === 'signup') openSignUp();
    });
    $('#nav-signin').onclick = openSignIn;
    $('#nav-signup').onclick = openSignUp;

    $('#form-link').onsubmit = async (e) => {
        e.preventDefault();
        const phone = e.target.phone.value.trim();
        try {
            const s = await api('/api/bot/link', { method: 'POST', body: JSON.stringify({ phone }) });
            if (s.pairingCode) {
                $('#pairing-display').classList.remove('hidden');
                $('#pairing-code').textContent = s.pairingCode;
            }
            refreshStatus();
        } catch (e) { alert(e.message); }
    };

    $('#btn-start').onclick     = () => api('/api/bot/start',  { method: 'POST' }).then(refreshStatus).catch(e => alert(e.message));
    $('#btn-stop').onclick      = () => api('/api/bot/stop',   { method: 'POST' }).then(refreshStatus).catch(e => alert(e.message));
    $('#btn-logout-bot').onclick = async () => {
        if (!confirm('Unlink your WhatsApp number? You\'ll need to re-pair to use the bot again.')) return;
        await api('/api/bot/logout', { method: 'POST' });
        $('#pairing-display').classList.add('hidden');
        refreshStatus();
    };

    $('#form-settings').onsubmit = async (e) => {
        e.preventDefault();
        const f = e.target;
        const settings = {
            botName: f.botName.value.trim(),
            prefix: f.prefix.value.trim() || '.',
            pairingName: (f.pairingName.value.trim() || 'DARKNODE').slice(0, 8),
            public:     f.public.checked,
            autoRead:   f.autoRead.checked,
            autoTyping: f.autoTyping.checked,
            chatbot:    f.chatbot.checked,
        };
        const owners = f.owners.value.split(',').map(s => s.trim()).filter(Boolean);
        await api('/api/settings', { method: 'POST', body: JSON.stringify({ settings, owners }) });
        const tag = $('#settings-saved');
        tag.classList.remove('hidden');
        setTimeout(() => tag.classList.add('hidden'), 1800);
    };

    $('#btn-delete-account').onclick = async () => {
        if (!confirm('Delete your DARKNODE account and unlink WhatsApp? This cannot be undone.')) return;
        await api('/api/account', { method: 'DELETE' });
        await clerk.signOut();
    };
}

// ─── Boot ───
(async () => {
    wire();
    show('landing');
    loadStats();
    try { await bootClerk(); } catch (e) { console.error(e); }
})();
