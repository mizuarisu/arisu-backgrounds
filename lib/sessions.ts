import { connectToDatabase } from './mongodb'
import { SessionRecord, UserRole, generateSessionId, SESSION_DURATION_MS } from './auth'

const COLLECTION_NAME = 'sessions'

export async function createSessionRecord(userId: string, username: string, role: UserRole): Promise<SessionRecord> {
  const { db } = await connectToDatabase()
  const collection = db.collection(COLLECTION_NAME)

  const now = Date.now()
  const record: SessionRecord = {
    sessionId: generateSessionId(),
    userId,
    username,
    role,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  }

  await collection.insertOne(record as any)
  return record
}

export async function getSessionRecord(sessionId: string): Promise<SessionRecord | null> {
  const { db } = await connectToDatabase()
  const collection = db.collection(COLLECTION_NAME)
  return (await collection.findOne({ sessionId })) as unknown as SessionRecord | null
}

export async function touchSession(sessionId: string): Promise<void> {
  const { db } = await connectToDatabase()
  const collection = db.collection(COLLECTION_NAME)
  await collection.updateOne({ sessionId }, { $set: { lastSeenAt: Date.now() } })
}

export async function deleteSessionRecord(sessionId: string): Promise<boolean> {
  const { db } = await connectToDatabase()
  const collection = db.collection(COLLECTION_NAME)
  const result = await collection.deleteOne({ sessionId })
  return result.deletedCount > 0
}

// Kick — delete a specific session by its ID (used by the "Kick" button)
export async function kickSession(sessionId: string): Promise<boolean> {
  return deleteSessionRecord(sessionId)
}

// Kick all sessions belonging to one user (e.g. when removing their account)
export async function kickAllSessionsForUser(userId: string): Promise<number> {
  const { db } = await connectToDatabase()
  const collection = db.collection(COLLECTION_NAME)
  const result = await collection.deleteMany({ userId })
  return result.deletedCount
}

export async function getAllActiveSessions(): Promise<SessionRecord[]> {
  const { db } = await connectToDatabase()
  const collection = db.collection(COLLECTION_NAME)
  const now = Date.now()
  // Clean up expired sessions while we're here
  await collection.deleteMany({ expiresAt: { $lt: now } })
  return (await collection.find({}).sort({ lastSeenAt: -1 }).toArray()) as unknown as SessionRecord[]
}
