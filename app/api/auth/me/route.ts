import { NextRequest, NextResponse } from 'next/server'
import { getValidSessionFromCookie } from '@/lib/session-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getValidSessionFromCookie(req.cookies.get('bgcheck-session')?.value)
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  return NextResponse.json({ username: session.username, role: session.role })
}
