import { randomBytes, scryptSync } from 'crypto'

export type UserRole = 'user' | 'admin' | 'manager'

export interface User {
  id: string
  username: string
  passwordHash: string
  role: UserRole
  description?: string
  createdAt: Date
}

// A session record now lives server-side in MongoDB so it can be revoked
// (kicked) on demand. The cookie only carries the sessionId — nothing else.
export interface SessionRecord {
  sessionId: string
  userId: string
  username: string
  role: UserRole
  createdAt: number
  lastSeenAt: number
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

// 3 hour hard expiry, in ms
export const SESSION_DURATION_MS = 3 * 60 * 60 * 1000

export function generateSessionId(): string {
  return randomBytes(24).toString('hex')
}

export function isSessionValid(session: SessionRecord): boolean {
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

