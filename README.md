# Roblox Background Check Tool

A complete Next.js 14 application for Roblox player verification with local database management.

## Features

✅ **Player Lookup** - Profile, groups, friends, badges with pagination  
✅ **Badge Chart** - Year-by-year timeline with PNG export  
✅ **Local Database** - Manage blacklists on `/database` page  
✅ **Division Groups** - Auto-labels 10 specific group IDs  
✅ **Friend Avatars** - Profile images with hover tooltips  
✅ **Risk Assessment** - Automatic flagging of blacklisted players  
✅ **Dark/Light Mode** - Toggle with system preference  
✅ **No External DB** - All data stored on your server  

---

## Quick Start

### 1. Install
```bash
npm install
```

### 2. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Deploy to Vercel
```bash
git add .
git commit -m "init"
git push origin main
# Go to vercel.com/new, import repo, deploy
```

---

## How It Works

**Database:** Stores blacklist entries as JSON file (`data/blacklist.json`)  
**API Routes:**
- `/api/lookup` - Roblox player data (via roproxy.com)
- `/api/database` - CRUD operations for blacklist

**Pages:**
- `/` - Player checker & badge chart export
- `/database` - Add/remove blacklisted users & groups

---

## Configuration

Edit `components/CheckerForm.tsx`:

```ts
const TARGET_GROUP = 4219097
const DIVISION_GROUPS = [812204725, 503346911, ...]
```

---

All set! Deploy and you're good to go.
