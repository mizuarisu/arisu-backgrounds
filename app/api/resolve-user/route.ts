import { NextRequest, NextResponse } from 'next/server'
import { logEvent } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    const res = await fetch('https://users.roproxy.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    })

    const data = await res.json()
    if (!data.data || data.data.length === 0) {
      logEvent('warn', 'username_resolve', `Username "${username}" not found`, { username })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    logEvent('info', 'username_resolve', `Resolved "${username}" to ID ${data.data[0].id}`, { username, userId: data.data[0].id })

    return NextResponse.json({
      id: String(data.data[0].id),
      name: data.data[0].name,
      displayName: data.data[0].displayName,
    })
  } catch (err: unknown) {
    logEvent('error', 'username_resolve', `Failed to resolve username: ${err instanceof Error ? err.message : 'unknown'}`)
    return NextResponse.json({ error: 'Failed to resolve username' }, { status: 500 })
  }
}
