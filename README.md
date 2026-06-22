# BGCheck — Roblox Background Check Tool

A Next.js 14 app for investigating Roblox players: profile, groups, friends, badge count, and a persistent shared blacklist database — all stored server-side in MongoDB.

## Features

- **Player Lookup** — profile, account age, groups, friends (with avatars), badge count
- **Blacklist Database** — add/remove flagged users and groups, shared across all sessions
- **Activity Logs** — every lookup, badge fetch, and database change is logged with timestamps, useful for troubleshooting
- **Night Mode** — black & red dark theme, toggle persists via localStorage
- **No external dependencies for storage** — everything lives in your MongoDB cluster

## Setup

```bash
npm install
```

Create `.env.local`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/roblox-checker?retryWrites=true&w=majority
ROBLOX_OPEN_CLOUD_KEY=<your-open-cloud-api-key>
```

### Authentication & Authorization

This app uses **role-based access control** with three tiers:

- **User** — Checker only (read-only player lookups)
- **Admin** — Checker + Database + Logs
- **Manager** — Checker + Database + Logs + account creation/management

All accounts are whitelist-only (no self-signup). You create accounts via the `/admin/users` page, which only managers can access.

**First-time setup:**

1. Create the first manager account locally:
   ```bash
   MONGODB_URI=<your-uri> node scripts/create-admin.js
   ```
   This prompts you for a username/password and creates a manager account in MongoDB.

2. After deploying, log in at `/login` with those credentials.

3. Go to `/admin/users` to create accounts for team members and assign their roles.

**Session behavior:**
- Sessions are stored in a secure, session-only cookie (cleared when the browser closes)
- Sessions also hard-expire after 3 hours, whichever comes first
- On logout, the cookie is deleted and the user is redirected to `/login`

```bash
npm run dev
```

Deploy to Vercel with `MONGODB_URI` and `ROBLOX_OPEN_CLOUD_KEY` set in environment variables.

## Badge counts

Badge counts are fetched two ways, depending on whether `ROBLOX_OPEN_CLOUD_KEY` is set:

- **With a key configured** — uses Roblox's [Open Cloud Inventory API](https://create.roblox.com/docs/cloud/guides/inventory) (`apis.roblox.com/cloud/v2/users/{userId}/inventory-items?filter=badges=true`), authenticated via an `x-api-key` header. This is the documented, stable path.
- **Without a key** — falls back to the legacy public endpoint (`badges.roblox.com/v1/users/{userId}/badges`) via roproxy, with no authentication. This endpoint's reliability has varied across 2025–2026 Roblox platform changes and may return empty results for some accounts even when the account does have badges.

### Getting an Open Cloud API key

1. Go to [create.roblox.com/dashboard/credentials](https://create.roblox.com/dashboard/credentials)
2. Open the **API Keys** tab → **Create API Key**
3. Add the **User Inventory API** permission with **Read** access (no need to scope it to a specific experience — this is a user-resource permission)
4. Leave IP restrictions blank if deploying on Vercel (dynamic IPs)
5. Save, copy the key immediately (shown once), and set it as `ROBLOX_OPEN_CLOUD_KEY` in both `.env.local` (local dev) and Vercel's environment variables (production)

**Keep this key private** — treat it like a password. Don't commit it to git or paste it anywhere public; `.env.local` is already gitignored.

If badge counts still look wrong after setting the key, check the **Logs** page — every `badge_fetch` entry includes which source (`opencloud` or `legacy`) was used and the raw debug info if something failed.

## Project structure

```
app/
  page.tsx           — Checker page
  database/page.tsx  — Blacklist manager page
  logs/page.tsx      — Activity log viewer
  api/
    lookup/          — Roblox data fetch (server-side, via roproxy + Open Cloud)
    database/        — Blacklist CRUD (MongoDB)
    logs/            — Log read/clear (MongoDB)
components/
  CheckerForm.tsx    — Main lookup UI
  DatabaseManager.tsx
  LogsViewer.tsx
  ThemeToggle.tsx    — Light/dark mode switch
lib/
  roblox.ts          — Roblox API helpers (badges, profile, friends, groups)
  database.ts        — Blacklist persistence (MongoDB)
  logger.ts          — Activity logging (MongoDB)
  mongodb.ts          — Connection helper
```

## Configuration

Target group and division groups are set in `components/CheckerForm.tsx`:

```ts
const TARGET_GROUP = 4219097
const DIVISION_GROUPS = [812204725, 503346911, ...]
```
