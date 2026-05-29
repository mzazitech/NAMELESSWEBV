/*══════════════════════════════════════
 *  Multi-tenant user store (Postgres / Neon)
 *  Identifies users by Clerk user id.
 *══════════════════════════════════════*/
import fs from 'fs';
import path from 'path';
import { query } from './db.js';

const DEFAULT_SETTINGS = {
    botName: 'DARKNODE BOT',
    prefix: '.',
    pairingName: 'DARKNODE',
    autoRead: false,
    autoTyping: false,
    chatbot: false,
    welcome: false,
    antilink: false,
    antibadword: false,
    public: true,
};

function rowToUser(row) {
    if (!row) return null;
    return {
        id: row.id,
        clerkUserId: row.clerk_user_id,
        email: row.email,
        settings: { ...DEFAULT_SETTINGS, ...(row.settings || {}) },
        owners: row.owners || [],
        createdAt: row.created_at,
    };
}

export async function listUsers() {
    const r = await query('SELECT * FROM users ORDER BY created_at ASC');
    return r.rows.map(rowToUser);
}

export async function getUser(id) {
    const r = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rowToUser(r.rows[0]);
}

export async function getUserByClerkId(clerkId) {
    const r = await query('SELECT * FROM users WHERE clerk_user_id = $1', [clerkId]);
    return rowToUser(r.rows[0]);
}

/**
 * Idempotently create or fetch a user keyed by their Clerk user id.
 * Called on every authenticated request so first-time signups are auto-provisioned.
 */
export async function upsertClerkUser(clerkId, email) {
    const existing = await getUserByClerkId(clerkId);
    if (existing) {
        if (email && existing.email !== email) {
            await query('UPDATE users SET email = $1, updated_at = now() WHERE id = $2', [email, existing.id]);
            existing.email = email;
        }
        return existing;
    }
    const id = clerkId; // use Clerk id as primary key — already unique and stable
    await query(
        `INSERT INTO users (id, clerk_user_id, email, settings, owners)
         VALUES ($1, $2, $3, $4::jsonb, $5)
         ON CONFLICT (id) DO NOTHING`,
        [id, clerkId, email || '', JSON.stringify(DEFAULT_SETTINGS), []]
    );
    fs.mkdirSync(path.resolve(`./sessions/${id}`), { recursive: true });
    return getUser(id);
}

export async function updateSettings(id, patch) {
    const u = await getUser(id);
    if (!u) throw new Error('User not found');
    const next = { ...u.settings, ...patch };
    await query(
        'UPDATE users SET settings = $1::jsonb, updated_at = now() WHERE id = $2',
        [JSON.stringify(next), id]
    );
    return getUser(id);
}

export async function setOwners(id, owners) {
    const list = Array.isArray(owners) ? owners.map(String) : [];
    await query(
        'UPDATE users SET owners = $1, updated_at = now() WHERE id = $2',
        [list, id]
    );
    return getUser(id);
}

export async function deleteUser(id) {
    const r = await query('DELETE FROM users WHERE id = $1', [id]);
    try { fs.rmSync(path.resolve(`./sessions/${id}`), { recursive: true, force: true }); } catch {}
    return r.rowCount > 0;
}

export function userSessionDir(id) {
    const dir = path.resolve(`./sessions/${id}`);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

export function userSettingsForBot(u) {
    const owners = (u.owners && u.owners.length ? u.owners : []).map(n => {
        const num = String(n).replace(/[^0-9]/g, '');
        return num.includes('@') ? num : `${num}@s.whatsapp.net`;
    });
    const prefix = (u.settings && u.settings.prefix) || '.';
    return {
        userId: u.id,
        botName: (u.settings && u.settings.botName) || 'DARKNODE BOT',
        prefa: [prefix],
        owners,
        public: u.settings?.public !== false,
    };
}
