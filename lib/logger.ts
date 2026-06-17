import { connectToDatabase } from './mongodb'

export type LogLevel = 'info' | 'warn' | 'error'
export type LogAction =
  | 'player_lookup'
  | 'badge_fetch'
  | 'username_resolve'
  | 'blacklist_add'
  | 'blacklist_remove'
  | 'blacklist_fetch'
  | 'system'

export interface LogEntry {
  level: LogLevel
  action: LogAction
  message: string
  meta?: Record<string, unknown>
  timestamp: string
}

async function getLogsCollection() {
  const { db } = await connectToDatabase()
  const collection = db.collection('logs')
  await collection.createIndex({ timestamp: -1 })
  return collection
}

export async function logEvent(level: LogLevel, action: LogAction, message: string, meta?: Record<string, unknown>) {
  try {
    const collection = await getLogsCollection()
    const entry: LogEntry = { level, action, message, meta, timestamp: new Date().toISOString() }
    await collection.insertOne(entry)
    // Trim to last 1000 logs to keep storage bounded
    const count = await collection.countDocuments()
    if (count > 1000) {
      const excess = count - 1000
      const oldest = await collection.find().sort({ timestamp: 1 }).limit(excess).toArray()
      const ids = oldest.map(o => o._id)
      if (ids.length) await collection.deleteMany({ _id: { $in: ids } })
    }
  } catch (e) {
    // Never let logging failure break the app
    console.error('Failed to write log:', e)
  }
}

export async function getLogs(limit = 200) {
  try {
    const collection = await getLogsCollection()
    const logs = await collection.find().sort({ timestamp: -1 }).limit(limit).toArray()
    return logs.map(l => ({
      id: String(l._id),
      level: l.level,
      action: l.action,
      message: l.message,
      meta: l.meta,
      timestamp: l.timestamp,
    }))
  } catch (e) {
    console.error('Failed to fetch logs:', e)
    return []
  }
}

export async function clearLogs() {
  try {
    const collection = await getLogsCollection()
    await collection.deleteMany({})
  } catch (e) {
    console.error('Failed to clear logs:', e)
    throw e
  }
}
