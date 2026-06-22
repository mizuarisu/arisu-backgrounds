import { randomBytes, scryptSync } from 'crypto'

export type UserRole = 'user' | 'admin' | 'manager'

export interface User {
  id: string
  username: string
  passwordHash: string
  role: UserRole
  createdAt: Date
}

export interface Session {
  userId: string
  username: string
  role: UserRole
  createdAt: number
  expiresAt: number
}

// Password hashing — scrypt is built-in and solid
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(':')
  if (!salt || !storedHash) return false
  const computed = scryptSync(password, salt, 32).toString('hex')
  return computed === storedHash
}

// Session management — 3 hour expiry in ms
const SESSION_DURATION_MS = 3 * 60 * 60 * 1000

export function createSession(userId: string, username: string, role: UserRole): Session {
  const now = Date.now()
  return {
    userId,
    username,
    role,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  }
}

export function isSessionValid(session: Session): boolean {
  return Date.now() < session.expiresAt
}

// Role checks
export function canAccess(role: UserRole, page: 'checker' | 'database' | 'logs' | 'admin-users'): boolean {
  const permissions: Record<UserRole, (string)[]> = {
    user: ['checker'],
    admin: ['checker', 'database', 'logs'],
    manager: ['checker', 'database', 'logs', 'admin-users'],
  }
  return permissions[role]?.includes(page) ?? false
}

// Session encoding/decoding for cookie
export function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString('base64')
}

export function decodeSession(encoded: string): Session | null {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'))
  } catch {
    return null
  }
}
