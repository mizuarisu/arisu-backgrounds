import { promises as fs } from 'fs'
import { join } from 'path'

export interface BlacklistEntry {
  id: string
  type: 'user' | 'group'
  value: string
  name?: string
  severity: 'high' | 'medium' | 'low'
  reason: string
  addedAt: string
}

export interface Database {
  users: BlacklistEntry[]
  groups: BlacklistEntry[]
}

const dbPath = join(process.cwd(), 'data', 'blacklist.json')

async function ensureDir() {
  try {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true })
  } catch (e) {
    // Dir already exists
  }
}

async function readDatabase(): Promise<Database> {
  await ensureDir()
  try {
    const content = await fs.readFile(dbPath, 'utf-8')
    return JSON.parse(content)
  } catch (e) {
    return { users: [], groups: [] }
  }
}

async function writeDatabase(db: Database) {
  await ensureDir()
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2))
}

export async function getDatabase(): Promise<Database> {
  return readDatabase()
}

export async function addEntry(entry: BlacklistEntry) {
  const db = await readDatabase()
  if (entry.type === 'user') {
    db.users.push(entry)
  } else {
    db.groups.push(entry)
  }
  await writeDatabase(db)
  return entry
}

export async function removeEntry(id: string) {
  const db = await readDatabase()
  db.users = db.users.filter(u => u.id !== id)
  db.groups = db.groups.filter(g => g.id !== id)
  await writeDatabase(db)
}

export async function updateEntry(id: string, updates: Partial<BlacklistEntry>) {
  const db = await readDatabase()
  const userIndex = db.users.findIndex(u => u.id === id)
  if (userIndex !== -1) {
    db.users[userIndex] = { ...db.users[userIndex], ...updates }
  }
  const groupIndex = db.groups.findIndex(g => g.id === id)
  if (groupIndex !== -1) {
    db.groups[groupIndex] = { ...db.groups[groupIndex], ...updates }
  }
  await writeDatabase(db)
}
