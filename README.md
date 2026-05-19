# Roblox Background Check

A clean, editorial-style Roblox player lookup tool built with Next.js 14 — inspired by the Payload CMS website template aesthetic.

## Features

- Player profile, bio, account age, verified/banned status
- Group rank check for group `4219097`
- Full friend list (flagged if blacklisted)
- All group memberships with links
- Badge count + breakdown by year
- Accessories worn + collectible count
- Blacklist database (stored in localStorage) for users and groups
- Risk assessment + written conclusion with links to flagged items
- Dark / light mode toggle

## Deploy to Vercel

### One-click deploy

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. No environment variables required
4. Click Deploy

That's it. Vercel will detect Next.js automatically.

### Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

The app uses a **Next.js API route** (`/api/lookup`) to call Roblox's APIs via [roproxy.com](https://roproxy.com) server-side. This avoids all CORS issues — the browser never calls roproxy directly, only the Next.js server does.

The blacklist is stored in **localStorage** in the user's browser. No database required.

## Changing the target group

Open `components/CheckerForm.tsx` and update:

```ts
const TARGET_GROUP = 4219097
```

## Notes

- Some player data (friends, inventory) may return empty if the player has privacy settings enabled
- Badges `byYear` reflects when the badge was *created*, not when the player earned it — this is a Roblox API limitation for public endpoints
- The `collectibles` count only reflects items visible via the public inventory API
