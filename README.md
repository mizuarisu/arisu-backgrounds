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
```

```bash
npm run dev
```

Deploy to Vercel with the same `MONGODB_URI` env var set in the project settings.

## ⚠️ Known limitation: badge counts

As of a Roblox platform change rolled out in February–March 2026, the public badge-listing endpoint (`badges.roblox.com/v1/users/{userId}/badges`) now requires an **authenticated Roblox session cookie** to return real data for most accounts. When called without one — which is what this app does, since it has no way to log in as a Roblox account — Roblox returns a `200 OK` with an empty result instead of an error.

This means **badge counts will show as "Hidden by Roblox" for most players**, and this isn't fixable from our side without building actual Roblox account authentication (logging in with a real account's cookie and refreshing it periodically), which carries its own risks (ToS, account bans, cookie expiry).

The app detects this exact signature and tells you clearly in the UI rather than silently showing a misleading "0". Check the **Logs** page after any lookup — entries tagged `badge_fetch` will say whether a badge count is real, restricted, or failed for another reason (e.g. rate limiting, network issue).

If you want badge data back, the long-term fix is migrating to Roblox's **Open Cloud Badges API**, which supports proper API keys instead of cookies — but that requires per-experience API keys tied to specific games, not a general "look up any player's total badges" use case, so it doesn't directly replace what this tool was doing.

## Project structure

```
app/
  page.tsx           — Checker page
  database/page.tsx  — Blacklist manager page
  logs/page.tsx      — Activity log viewer
  api/
    lookup/          — Roblox data fetch (server-side, via roproxy)
    database/        — Blacklist CRUD (MongoDB)
    logs/            — Log read/clear (MongoDB)
components/
  CheckerForm.tsx    — Main lookup UI
  DatabaseManager.tsx
  LogsViewer.tsx
  ThemeToggle.tsx    — Light/dark mode switch
lib/
  roblox.ts          — Roblox API helpers
  database.ts        — Blacklist persistence (MongoDB)
  logger.ts          — Activity logging (MongoDB)
  mongodb.ts         — Connection helper
```

## Configuration

Target group and division groups are set in `components/CheckerForm.tsx`:

```ts
const TARGET_GROUP = 4219097
const DIVISION_GROUPS = [812204725, 503346911, ...]
```
