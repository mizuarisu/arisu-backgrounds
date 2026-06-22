import { NextRequest, NextResponse } from 'next/server'
import { getDatabase, addEntry, removeEntry, type BlacklistEntry } from '@/lib/database'
import { logEvent } from '@/lib/logger'
import { getValidSessionFromCookie, requireRole } from '@/lib/session-guard'

export const dynamic = 'force-dynamic'

async function getSession(req: NextRequest) {
  return getValidSessionFromCookie(req.cookies.get('bgcheck-session')?.value)
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!requireRole(session.role, 'database')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const db = await getDatabase()
    return NextResponse.json(db)
  } catch (err: unknown) {
    logEvent('error', 'blacklist_fetch', 'Failed to fetch blacklist database', { error: String(err) })
    return NextResponse.json({ error: 'Failed to fetch database' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!requireRole(session.role, 'database')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { type, value, name, severity, reason } = await req.json()

    if (!type || !value || !severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const entry: BlacklistEntry = {
      id: Date.now().toString(),
      type,
      value,
      name,
      severity,
      reason,
      addedAt: new Date().toISOString(),
    }

    await addEntry(entry)
    logEvent('info', 'blacklist_add', `${session.username} added ${type} "${name || value}" to blacklist`, { type, value, name, severity, reason, addedBy: session.username })
    return NextResponse.json({ success: true, entry })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add entry'
    logEvent('error', 'blacklist_add', `Failed to add blacklist entry: ${message}`, { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!requireRole(session.role, 'database')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await removeEntry(id)
    logEvent('info', 'blacklist_remove', `${session.username} removed blacklist entry`, { id, removedBy: session.username })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete entry'
    logEvent('error', 'blacklist_remove', `Failed to delete blacklist entry: ${message}`, { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
