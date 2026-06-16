import { getBlacklistCollection } from './mongodb'
import { ObjectId } from 'mongodb'

export interface BlacklistEntry {
  _id?: ObjectId
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

export async function getDatabase(): Promise<Database> {
  try {
    const collection = await getBlacklistCollection()
    const users = await collection.find({ type: 'user' }).toArray()
    const groups = await collection.find({ type: 'group' }).toArray()
    
    return {
      users: users as BlacklistEntry[],
      groups: groups as BlacklistEntry[],
    }
  } catch (e) {
    console.error('Database error:', e)
    return { users: [], groups: [] }
  }
}

export async function addEntry(entry: BlacklistEntry) {
  try {
    const collection = await getBlacklistCollection()
    const result = await collection.insertOne(entry)
    return { ...entry, _id: result.insertedId }
  } catch (e) {
    console.error('Add entry error:', e)
    throw e
  }
}

export async function removeEntry(id: string) {
  try {
    const collection = await getBlacklistCollection()
    await collection.deleteOne({ id })
  } catch (e) {
    console.error('Remove entry error:', e)
    throw e
  }
}

export async function updateEntry(id: string, updates: Partial<BlacklistEntry>) {
  try {
    const collection = await getBlacklistCollection()
    await collection.updateOne({ id }, { $set: updates })
  } catch (e) {
    console.error('Update entry error:', e)
    throw e
  }
}
