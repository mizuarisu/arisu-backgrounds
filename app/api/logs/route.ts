import { NextRequest, NextResponse } from 'next/server'
import { getLogs, clearLogs } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get('limit')) || 200
    const logs = await getLogs(limit)
    return NextResponse.json({ logs })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await clearLogs()
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 })
  }
}
