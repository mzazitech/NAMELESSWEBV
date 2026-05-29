/*════════════════════════════════════════
 *  Multi-tenant DARKNODE BOT — web host
 *  Auth: Clerk   Storage: Postgres (Neon)
 *══════════════════════════════════════════*/
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { clerkMiddleware, requireAuth as clerkRequireAuth, getAuth, clerkClient } from '@clerk/express';

import { initSchema } from './db.js';
import {
    listUsers, getUser, upsertClerkUser,
    updateSettings, setOwners, deleteUser,
} from './users.js';
import botManager from './botManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '5000');
const HOST = '0.0.0.0';

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// Clerk middleware — only mount if keys are configured AND valid.
// This lets the static site + /api/config still work so the dashboard can
// show a helpful "set your Clerk keys" message instead of crashing every route.
let CLERK_READY = false;
(() => {
    const pk = process.env.CLERK_PUBLISHABLE_KEY;
    const sk = process.env.CLERK_SECRET_KEY;
    if (!pk || !sk) {
        console.warn('[clerk] CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY are not set — auth routes will return 503');
        return;
    }
    if (!pk.startsWith('pk_test_') && !pk.startsWith('pk_live_')) {
        console.warn('[clerk] CLERK_PUBLISHABLE_KEY does not look valid (must start with pk_test_ or pk_live_) — auth routes will return 503');
        return;
    }
    try {
        app.use(clerkMiddleware());
        CLERK_READY = true;
    } catch (e) {
        console.warn('[clerk] failed to mount Clerk middleware:', e?.message || e);
    }
})();

// ───────── auth helpers ─────────
async function loadUser(req, res, next) {
    if (!CLERK_READY) return res.status(503).json({ error: 'Clerk is not configured on the server. Set CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.' });
    try {
        const auth = getAuth(req);
        if (!auth?.userId) return res.status(401).json({ error: 'auth required' });
        let email = '';
        try {
            const cu = await clerkClient.users.getUser(auth.userId);
            email = cu?.emailAddresses?.[0]?.emailAddress || '';
        } catch {}
        const u = await upsertClerkUser(auth.userId, email);
        req.user = u;
        next();
    } catch (e) {
        console.error('[loadUser]', e?.message || e);
        res.status(500).json({ error: 'auth lookup failed' });
    }
}

// ───────── boot the modular command registry once ─────────
(async () => {
    try {
        const reg = await import('../all/system/commandRegistry.js');
        await reg.loadAllCommands(true);
        global.__commandRegistry = reg;
    } catch (e) {
        console.log('[CommandRegistry] failed to load:', e?.message || e);
    }
})();

// ───────── public config endpoint (so frontend can pick up the publishable key) ─────────
app.get('/api/config', (_req, res) => {
    res.json({
        clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
    });
});

// ───────── user (Clerk-authenticated) ─────────
app.get('/api/auth/me', async (req, res) => {
    if (!CLERK_READY) return res.json({ user: null });
    const auth = getAuth(req);
    if (!auth?.userId) return res.json({ user: null });
    try {
        let email = '';
        try {
            const cu = await clerkClient.users.getUser(auth.userId);
            email = cu?.emailAddresses?.[0]?.emailAddress || '';
        } catch {}
        const u = await upsertClerkUser(auth.userId, email);
        res.json({
            user: {
                id: u.id,
                email: u.email,
                settings: u.settings,
                owners: u.owners || [],
                createdAt: u.createdAt,
            },
        });
    } catch (e) {
        console.error('[me]', e?.message || e);
        res.status(500).json({ error: 'failed to load user' });
    }
});

// ───────── bot API ─────────
app.get('/api/bot/status', loadUser, (req, res) => {
    res.json(botManager.getStatus(req.user.id));
});

app.post('/api/bot/link', loadUser, async (req, res) => {
    try {
        const { phone } = req.body || {};
        if (!phone) return res.status(400).json({ error: 'phone required' });
        await botManager.start(req.user.id, phone);
        const start = Date.now();
        while (Date.now() - start < 6000) {
            const st = botManager.getStatus(req.user.id);
            if (st.pairingCode) return res.json(st);
            await new Promise(r => setTimeout(r, 250));
        }
        res.json(botManager.getStatus(req.user.id));
    } catch (e) {
        res.status(500).json({ error: e?.message || 'failed to link' });
    }
});

app.post('/api/bot/start', loadUser, async (req, res) => {
    try {
        await botManager.start(req.user.id);
        res.json(botManager.getStatus(req.user.id));
    } catch (e) {
        res.status(500).json({ error: e?.message || 'failed' });
    }
});

app.post('/api/bot/stop', loadUser, async (req, res) => {
    await botManager.stop(req.user.id);
    res.json({ ok: true });
});

app.post('/api/bot/logout', loadUser, async (req, res) => {
    await botManager.logout(req.user.id);
    res.json({ ok: true });
});

app.post('/api/settings', loadUser, async (req, res) => {
    try {
        const { settings, owners } = req.body || {};
        if (settings) await updateSettings(req.user.id, settings);
        if (Array.isArray(owners)) await setOwners(req.user.id, owners);
        await botManager.refreshSettings(req.user.id);
        const u = await getUser(req.user.id);
        res.json({ ok: true, settings: u.settings, owners: u.owners });
    } catch (e) {
        res.status(400).json({ error: e?.message || 'failed' });
    }
});

app.delete('/api/account', loadUser, async (req, res) => {
    await botManager.logout(req.user.id);
    await deleteUser(req.user.id);
    // Note: we don't delete the Clerk user here — the user can revoke from Clerk's dashboard.
    res.json({ ok: true });
});

// ───────── stats (public) ─────────
app.get('/api/stats', async (_req, res) => {
    try {
        const all = await listUsers();
        res.json({ totalUsers: all.length, activeBots: botManager.activeCount() });
    } catch (e) {
        res.json({ totalUsers: 0, activeBots: botManager.activeCount(), error: e?.message });
    }
});

// ───────── healthcheck (Render uses this) ─────────
app.get('/healthz', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ───────── static UI ─────────
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

(async () => {
    try { await initSchema(); } catch (e) { console.error('[db init]', e?.message || e); }

    app.listen(PORT, HOST, async () => {
        let count = 0;
        try { count = (await listUsers()).length; } catch {}
        console.log(`╔═════════════════════════════════════════╗`);
        console.log(`║  DARKNODE BOT — Multi-tenant Web Host   ║`);
        console.log(`╠═════════════════════════════════════════╣`);
        console.log(`║  Listening on  http://${HOST}:${PORT}`);
        console.log(`║  Users         ${count}`);
        console.log(`╚═════════════════════════════════════════╝`);
    });

    // auto-resume already-paired bots on boot
    setTimeout(async () => {
        try {
            const users = await listUsers();
            const fs = await import('fs');
            for (const u of users) {
                const dir = path.resolve(`./sessions/${u.id}`);
                if (fs.existsSync(path.join(dir, 'creds.json'))) {
                    console.log(`[Boot] resuming ${u.email}`);
                    botManager.start(u.id).catch(e => console.log('[Boot] resume err', u.email, e?.message));
                }
            }
        } catch (e) {
            console.log('[Boot] resume scan failed:', e?.message || e);
        }
    }, 1500);
})();
