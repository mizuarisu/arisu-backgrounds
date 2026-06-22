#!/usr/bin/env node
/**
 * Bootstrap script to create the first manager account.
 * Run once locally before deploying:
 *
 *   MONGODB_URI=<your-uri> node scripts/create-admin.js
 *
 * This creates a manager account with the username and password you provide.
 * After that, use the web UI to create more accounts.
 */

const readline = require('readline')
const { MongoClient } = require('mongodb')
const { randomBytes, scryptSync } = require('crypto')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve))
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${hash}`
}

async function createFirstManager() {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    console.error('❌ Error: MONGODB_URI environment variable not set')
    process.exit(1)
  }

  console.log('🔐 Create First Manager Account')
  console.log('────────────────────────────────')

  const username = await prompt('Manager username: ')
  const password = await prompt('Manager password: ')

  if (!username.trim() || !password.trim()) {
    console.error('❌ Username and password required')
    process.exit(1)
  }

  const client = new MongoClient(mongoUri)

  try {
    await client.connect()
    const db = client.db('roblox-checker')
    const usersCollection = db.collection('users')

    // Check if any user exists
    const existingCount = await usersCollection.countDocuments({})
    if (existingCount > 0) {
      console.error('❌ Error: Accounts already exist. Use the web UI to create more.')
      process.exit(1)
    }

    const user = {
      id: randomBytes(12).toString('hex'),
      username: username.trim(),
      passwordHash: hashPassword(password.trim()),
      role: 'manager',
      createdAt: new Date(),
    }

    await usersCollection.insertOne(user)
    console.log('✅ Manager account created successfully!')
    console.log(`   Username: ${user.username}`)
    console.log(`   Role: manager`)
    console.log('\nYou can now deploy and log in with this account.')
  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  } finally {
    await client.close()
    rl.close()
  }
}

createFirstManager()
