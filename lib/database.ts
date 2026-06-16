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

// In-memory database for serverless compatibility
let inMemoryDB: Database = { users: [], groups: [] }

export async function getDatabase(): Promise<Database> {
  return inMemoryDB
}

export async function addEntry(entry: BlacklistEntry) {
  if (entry.type === 'user') {
    inMemoryDB.users.push(entry)
  } else {
    inMemoryDB.groups.push(entry)
  }
  return entry
}

export async function removeEntry(id: string) {
  inMemoryDB.users = inMemoryDB.users.filter(u => u.id !== id)
  inMemoryDB.groups = inMemoryDB.groups.filter(g => g.id !== id)
}

export async function updateEntry(id: string, updates: Partial<BlacklistEntry>) {
  const userIndex = inMemoryDB.users.findIndex(u => u.id === id)
  if (userIndex !== -1) {
    inMemoryDB.users[userIndex] = { ...inMemoryDB.users[userIndex], ...updates }
  }
  const groupIndex = inMemoryDB.groups.findIndex(g => g.id === id)
  if (groupIndex !== -1) {
    inMemoryDB.groups[groupIndex] = { ...inMemoryDB.groups[groupIndex], ...updates }
  }
}
