import { connectToDatabase } from './mongodb'
import { User, UserRole, hashPassword } from './auth'
import { randomBytes } from 'crypto'

const COLLECTION_NAME = 'users'

export async function createUser(username: string, password: string, role: UserRole): Promise<User> {
  const { db } = await connectToDatabase()
  const collection = db.collection(COLLECTION_NAME)

  // Check if user already exists
  const existing = await collection.findOne({ username })
  if (existing) {
    throw new Error('User already exists')
  }

  const user: User = {
    id: randomBytes(12).toString('hex'),
    username,
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date(),
  }

  await collection.insertOne(user as any)
  return user
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const { db } = await connectToDatabase()
  const collection = db.collection(COLLECTION_NAME)
  return (await collection.findOne({ username })) as User | null
}

export async function getUserById(id: string): Promise<User | null> {
  const { db } = await connectToDatabase()
  const collection = db.collection(COLLECTION_NAME)
  return (await collection.findOne({ id })) as User | null
}

export async function getAllUsers(): Promise<User[]> {
  const { db } = await connectToDatabase()
  const collection = db.collection(COLLECTION_NAME)
  return (await collection.find({}).sort({ createdAt: -1 }).toArray()) as unknown as User[]
}

export async function deleteUser(id: string): Promise<boolean> {
  const { db } = await connectToDatabase()
  const collection = db.collection(COLLECTION_NAME)
  const result = await collection.deleteOne({ id })
  return result.deletedCount > 0
}

export async function updateUserRole(id: string, role: UserRole): Promise<boolean> {
  const { db } = await connectToDatabase()
  const collection = db.collection(COLLECTION_NAME)
  const result = await collection.updateOne({ id }, { $set: { role } })
  return result.modifiedCount > 0
}

// Ensure at least one manager exists (for bootstrap)
export async function ensureManagerExists(): Promise<boolean> {
  const { db } = await connectToDatabase()
  const collection = db.collection(COLLECTION_NAME)
  const managerCount = await collection.countDocuments({ role: 'manager' })
  return managerCount > 0
}

// Generate a temporary password for manual account creation
export function generateTempPassword(): string {
  return randomBytes(8).toString('hex')
}
