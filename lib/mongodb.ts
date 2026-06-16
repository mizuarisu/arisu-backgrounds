import { MongoClient, Db } from 'mongodb'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roblox-checker'
const DB_NAME = 'roblox-checker'

export async function connectToDatabase() {
  if (cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(DB_NAME)

  cachedClient = client
  cachedDb = db

  return { client, db }
}

export async function getBlacklistCollection() {
  const { db } = await connectToDatabase()
  const collection = db.collection('blacklist')
  
  // Create index for faster queries
  await collection.createIndex({ type: 1, value: 1 }, { unique: false })
  
  return collection
}
