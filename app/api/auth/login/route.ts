import { NextRequest, NextResponse } from 'next/server'
import { getUserByUsername, generateTempPassword } from '@/lib/db-users'
import { verifyPassword, createSession, encodeSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    const user = await getUserByUsername(username)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const session = createSession(user.id, user.username, user.role)
    const encoded = encodeSession(session)

    const response = NextResponse.json({ success: true, role: user.role })
    // Session cookie — no httpOnly on client component side, but secure + sameSite
    // The "session closes on tab close" is the browser default for non-persistent cookies
    response.cookies.set('bgcheck-session', encoded, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // No maxAge = session cookie (cleared on browser close)
    })
    return response
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Login failed' }, { status: 500 })
  }
}
