/*════════════════════════════════════════
 *  Postgres (Neon) connection + schema
 *══════════════════════════════════════════*/
import pg from 'pg';
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.warn('[db] DATABASE_URL is not set — the app will crash on first query');
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
});

export async function query(text, params) {
    const res = await pool.query(text, params);
    return res;
}

export async function initSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS users (
            id              TEXT PRIMARY KEY,
            clerk_user_id   TEXT UNIQUE NOT NULL,
            email           TEXT NOT NULL,
            settings        JSONB NOT NULL DEFAULT '{}'::jsonb,
            owners          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS users_clerk_user_id_idx ON users(clerk_user_id);
        CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
    `);
    console.log('[db] schema OK');
}
