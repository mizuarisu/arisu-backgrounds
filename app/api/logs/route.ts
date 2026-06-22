import { NextRequest, NextResponse } from 'next/server'
import { getLogs, clearLogs } from '@/lib/logger'
import { getValidSessionFromCookie, requireRole } from '@/lib/session-guard'

export const dynamic = 'force-dynamic'

async function getSession(req: NextRequest) {
  return getValidSessionFromCookie(req.cookies.get('bgcheck-session')?.value)
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!requireRole(session.role, 'logs')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const limit = Number(req.nextUrl.searchParams.get('limit')) || 200
    const logs = await getLogs(limit)
    return NextResponse.json({ logs })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!requireRole(session.role, 'logs')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    await clearLogs()
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 })
  }
}
