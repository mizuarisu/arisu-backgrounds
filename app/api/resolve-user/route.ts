import { NextRequest, NextResponse } from 'next/server'

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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: String(data.data[0].id),
      name: data.data[0].name,
      displayName: data.data[0].displayName,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to resolve username' }, { status: 500 })
  }
}
