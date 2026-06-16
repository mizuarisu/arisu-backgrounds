# Roblox Background Check Tool

A complete Next.js 14 application for Roblox player verification with persistent MongoDB database.

## Features

✅ **Player Lookup** - Profile, groups, friends, badges with pagination  
✅ **Badge Chart** - Year-by-year timeline with PNG export  
✅ **Persistent Database** - MongoDB stores all blacklist data server-side  
✅ **Shared Database** - All users see the same blacklist  
✅ **Division Groups** - Auto-labels 10 specific group IDs  
✅ **Friend Avatars** - Profile images with hover tooltips  
✅ **Risk Assessment** - Automatic flagging of blacklisted players  
✅ **Dark/Light Mode** - Toggle with system preference  

---

## Setup

### 1. Get MongoDB (Free)

**Option A: MongoDB Atlas (Recommended)**
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free
3. Create a free cluster (M0)
4. Get your connection string from "Connect" button
   - Should look like: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`

**Option B: Local MongoDB**
```bash
# If you have MongoDB installed locally
mongod  # Start the server
# Connection string: mongodb://localhost:27017/roblox-checker
```

### 2. Setup Environment

Create `.env.local`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

Replace with your actual MongoDB connection string.

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
git add .
git commit -m "init"
git push origin main
```

Go to [vercel.com/new](https://vercel.com/new):
1. Import your repo
2. Add environment variable `MONGODB_URI` with your MongoDB connection string
3. Deploy!

All blacklist data will persist across deployments.

---

## How It Works

**Database:** MongoDB stores blacklist entries persistently  
**API Routes:**
- `/api/lookup` - Roblox player data
- `/api/resolve-user` - Username resolution
- `/api/database` - Blacklist CRUD

**Pages:**
- `/` - Player checker & badge chart export
- `/database` - Add/remove blacklisted users & groups (shared across all users)

---

## Configuration

Edit `components/CheckerForm.tsx`:

```ts
const TARGET_GROUP = 4219097
const DIVISION_GROUPS = [812204725, 503346911, ...]
```

---

## Notes

- **Shared Database**: All users/sessions see the same blacklist
- **Persistent**: Data remains after closing the website
- **Server-Side**: No local storage, everything on MongoDB
- **Free MongoDB Tier**: Includes up to 512MB storage (plenty for blacklist)
