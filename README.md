# Roblox Background Check

A Next.js 14 background check tool for Roblox players with Trello-powered blacklist management.

## Features

✅ Player profile, bio, account age, verified/banned status  
✅ Group rank check for group `4219097`  
✅ Division group detection (10 specific group IDs)  
✅ Full friend list with avatars (hover to see username)  
✅ All group memberships with "show more" expansion  
✅ Badge count + year-by-year chart (up to 1000 badges tracked)  
✅ Accessories worn + collectible count  
✅ **Trello-based blacklist database** for users and groups  
✅ Risk assessment + written conclusion with links to flagged items  
✅ Dark / light mode toggle  
✅ Inter font from Google Fonts

---

## Trello Setup

This app uses **Trello** for blacklist management instead of localStorage.

### 1. Create a Trello board

1. Go to [trello.com](https://trello.com) and create a new board (name it whatever you want, e.g. "Roblox Blacklist")
2. Create two lists:
   - `Blacklisted Users`
   - `Blacklisted Groups`

### 2. Get your Trello API credentials

1. Go to [trello.com/power-ups/admin](https://trello.com/power-ups/admin)
2. Click "New" to create a new Power-Up (just fill in a name, doesn't matter)
3. Copy your **API Key**
4. Click the "Token" link next to the API Key to generate a **Token** (authorize it)
5. Copy your **Token**

### 3. Get your Board ID

1. Open your Trello board
2. Add `.json` to the end of the URL and press Enter
   - Example: `https://trello.com/b/ABC123.json`
3. Find `"id"` near the top — that's your **Board ID**

### 4. Add environment variables

Create a `.env.local` file in the project root:

```bash
TRELLO_API_KEY=your_api_key_here
TRELLO_TOKEN=your_token_here
TRELLO_BOARD_ID=your_board_id_here
```

---

## Deploy to Vercel

### One-click deploy

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Add the three environment variables from above in the Vercel dashboard:
   - `TRELLO_API_KEY`
   - `TRELLO_TOKEN`
   - `TRELLO_BOARD_ID`
4. Click Deploy

### Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How it works

- **Roblox API calls** happen server-side via `/api/lookup` using [roproxy.com](https://roproxy.com) — no CORS issues
- **Blacklist** is stored in Trello cards:
  - Card name = username or group ID
  - Card description = `Severity: high\nReason: exploiter\nAdded: 2024-01-15T10:30:00Z`
- **Badge tracking** fetches up to 10 pages (1000 badges max) from the Roblox API
- **Friend avatars** are fetched via the Roblox thumbnail API

---

## Changing settings

**Target group:** Open `components/CheckerForm.tsx` and update:
```ts
const TARGET_GROUP = 4219097
```

**Division groups:** Same file, update:
```ts
const DIVISION_GROUPS = [812204725, 503346911, 34510781, 8310499, 5336916, 5351323, 5351327, 5336904, 33036871, 5336914]
```

---

## Notes

- Some player data (friends, inventory) may return empty if the player has privacy settings enabled
- Badge `byYear` reflects when the badge was *created*, not when earned (Roblox API limitation)
- The chart shows badge acquisition trends over time
- Friend avatars load via Roblox CDN — if Roblox is down, initials will show instead
