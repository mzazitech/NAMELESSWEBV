# Deploying DARKNODE BOT to Render

This is a multi-tenant WhatsApp bot host. Each user signs in with **Clerk**,
their account lives in a **Neon Postgres** database, and the bot they pair
runs in the same Node.js process — fully isolated from every other user's
prefix, owner, and settings.

## What you need before you start

1. A **Render** account → <https://render.com>
2. A **Neon** Postgres database → <https://neon.tech>
   - Create a project, copy the **pooled** connection string from the dashboard
     (it looks like `postgresql://user:pwd@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`).
3. A **Clerk** application → <https://dashboard.clerk.com>
   - Create an application, choose Email as the primary identifier
     (Google / GitHub social logins are fine to enable too).
   - Open **API Keys** and copy:
     - `Publishable key` → `pk_live_...` or `pk_test_...`
     - `Secret key`     → `sk_live_...` or `sk_test_...`

---

## Option A — One-click via the included `render.yaml` (recommended)

1. Push this folder to a new GitHub repo.
2. In Render, click **New → Blueprint**, point it at the repo.
3. Render reads `render.yaml`, creates the web service, and prompts you for the
   secret env vars. Paste:
   - `DATABASE_URL`           = your Neon connection string
   - `CLERK_PUBLISHABLE_KEY`  = `pk_live_...`
   - `CLERK_SECRET_KEY`       = `sk_live_...`
   - `AI_INTEGRATIONS_OPENAI_BASE_URL` (optional)
   - `AI_INTEGRATIONS_OPENAI_API_KEY`  (optional)
4. Click **Apply**. Render provisions the service and a 1 GB persistent disk
   mounted at `/opt/render/project/src/sessions` (for Baileys creds).
5. Once the deploy is green, open the Render URL — you should see the landing
   page and the `Sign up` / `Sign in` buttons (Clerk widgets).

## Option B — Manual setup

1. **New → Web Service** in Render, connect this repo.
2. Set:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/healthz`
   - **Plan:** Starter or higher (Free tier won't keep WhatsApp paired across deploys).
3. Add these environment variables:
   | Name                              | Value                                      |
   | --------------------------------- | ------------------------------------------ |
   | `DATABASE_URL`                    | Your Neon pooled connection string         |
   | `CLERK_PUBLISHABLE_KEY`           | `pk_…` from Clerk dashboard                |
   | `CLERK_SECRET_KEY`                | `sk_…` from Clerk dashboard                |
   | `AI_INTEGRATIONS_OPENAI_BASE_URL` | (optional) OpenAI-compatible base URL      |
   | `AI_INTEGRATIONS_OPENAI_API_KEY`  | (optional) OpenAI key                      |
4. Add a **Disk**: name `darknode-data`, mount path
   `/opt/render/project/src/sessions`, size `1 GB`. **Important** — without a
   disk, every redeploy wipes Baileys creds and all users have to re-pair.
5. Deploy.

---

## After it's live

Visit the URL Render gives you (e.g. `https://darknode-bot.onrender.com`).

1. Click **Sign up**, create an account through the Clerk widget.
2. The dashboard appears. Click **Get pairing code**, enter your WhatsApp
   number in international format (digits only, e.g. `2547XXXXXXXX`).
3. Open WhatsApp on that phone → **Settings → Linked Devices → Link a device →
   Link with phone number** → enter the 8-character code shown on the page.
4. Pick your prefix (`.`, `/`, `!`, etc.) under **Settings** and save.
5. Send `.menu` (or whatever prefix you chose) to your bot. Done.

Each new user that signs up gets their own isolated bot instance. The 652
commands are loaded once at boot and shared by all instances — but every
command sees its own user's prefix, owners, and settings via the
`sock.userSettings` injection in `web/botManager.js`.

---

## Troubleshooting

- **"Clerk is not configured"** in the browser → set
  `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` and redeploy.
- **`[db init] connect ECONNREFUSED`** → check `DATABASE_URL`. Neon strings must
  end with `?sslmode=require`.
- **Bot disconnects every few minutes** → make sure you're on the Starter plan
  or higher. Free instances spin down on idle, killing the WhatsApp socket.
- **Pairing code never arrives** → confirm the phone number you entered
  exactly matches the one you'll pair (international format, no `+` or
  spaces). Check Render logs for `[BotMgr] pairing error`.
- **Want to log out a user's bot** → use the **Unlink WhatsApp** button on
  the dashboard, or delete the account entirely from Danger Zone.

## Local development

```bash
npm install
export DATABASE_URL="postgresql://…"          # Neon
export CLERK_PUBLISHABLE_KEY="pk_test_…"
export CLERK_SECRET_KEY="sk_test_…"
npm start
# → open http://localhost:5000
```

## File map (the parts you'll actually touch)

| Path                          | What                                                |
| ----------------------------- | --------------------------------------------------- |
| `web/server.js`               | Express app + Clerk middleware                      |
| `web/db.js`                   | Postgres pool + `users` table schema                |
| `web/users.js`                | User CRUD (Postgres-backed)                         |
| `web/botManager.js`           | Per-user Baileys socket lifecycle                   |
| `web/public/`                 | Static dashboard (HTML/CSS/JS)                      |
| `all/system/mzazi.js`         | Message handler — reads `sock.userSettings`         |
| `all/system/commandRegistry.js` | Loads & dispatches the 652 commands              |
| `sessions/<userId>/`          | Baileys credentials (one folder per user)           |
| `render.yaml`                 | Render Blueprint                                     |

## Database schema

A single `users` table is created automatically on first boot:

```sql
CREATE TABLE users (
    id              TEXT PRIMARY KEY,           -- equals clerk_user_id
    clerk_user_id   TEXT UNIQUE NOT NULL,
    email           TEXT NOT NULL,
    settings        JSONB NOT NULL DEFAULT '{}'::jsonb,
    owners          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

No migrations to run — `web/db.js` ensures the schema on startup.
