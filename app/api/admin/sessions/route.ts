import { NextRequest, NextResponse } from 'next/server'
import { getAllActiveSessions, kickSession, getSessionRecord } from '@/lib/sessions'
import { getValidSessionFromCookie, requireRole } from '@/lib/session-guard'
import { notifySessionKicked } from '@/lib/discord'
import { logEvent } from '@/lib/logger'

export const dynamic = 'force-dynamic'

async function getSession(req: NextRequest) {
  return getValidSessionFromCookie(req.cookies.get('bgcheck-session')?.value)
}

// GET — list all active sessions (manager only)
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!requireRole(session.role, 'admin-users')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const sessions = await getAllActiveSessions()
    return NextResponse.json({
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        username: s.username,
        role: s.role,
        createdAt: s.createdAt,
        lastSeenAt: s.lastSeenAt,
        expiresAt: s.expiresAt,
        isYou: s.sessionId === req.cookies.get('bgcheck-session')?.value,
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to fetch sessions' }, { status: 500 })
  }
}

// DELETE — kick a specific session by sessionId (manager only)
export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!requireRole(session.role, 'admin-users')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

    const target = await getSessionRecord(sessionId)
    if (!target) return NextResponse.json({ error: 'Session not found (may have already expired)' }, { status: 404 })

    await kickSession(sessionId)

    logEvent('warn', 'system', `${session.username} kicked ${target.username}'s session`, { kickedBy: session.username, kickedUsername: target.username })
    notifySessionKicked(session.username, target.username)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to kick session' }, { status: 500 })
  }
}
