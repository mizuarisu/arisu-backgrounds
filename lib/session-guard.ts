import { cookies } from 'next/headers'
import { getSessionRecord, touchSession, deleteSessionRecord } from './sessions'
import { isSessionValid, canAccess, UserRole, SessionRecord } from './auth'

// Validates the session cookie against MongoDB. Must only be called from
// Node.js runtime contexts (Server Components, Route Handlers) — never from
// middleware, since MongoDB's driver isn't Edge-compatible.
export async function getValidSession(): Promise<SessionRecord | null> {
  const sessionId = cookies().get('bgcheck-session')?.value
  if (!sessionId) return null

  const record = await getSessionRecord(sessionId)
  if (!record) return null

  if (!isSessionValid(record)) {
    await deleteSessionRecord(sessionId) // clean up expired session
    return null
  }

  touchSession(sessionId) // fire-and-forget last-seen update
  return record
}

// For use inside API route handlers, where we have the NextRequest cookie directly.
export async function getValidSessionFromCookie(sessionId: string | undefined): Promise<SessionRecord | null> {
  if (!sessionId) return null

  const record = await getSessionRecord(sessionId)
  if (!record) return null

  if (!isSessionValid(record)) {
    await deleteSessionRecord(sessionId)
    return null
  }

  touchSession(sessionId)
  return record
}

export function requireRole(role: UserRole, page: 'checker' | 'database' | 'logs' | 'admin-users'): boolean {
  return canAccess(role, page)
}
