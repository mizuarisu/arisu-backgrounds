import { NextRequest, NextResponse } from 'next/server'
import { getUserByUsername } from '@/lib/db-users'
import { verifyPassword } from '@/lib/auth'
import { createSessionRecord } from '@/lib/sessions'
import { notifyLogin } from '@/lib/discord'
import { logEvent } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    const user = await getUserByUsername(username)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      logEvent('warn', 'system', `Failed login attempt for username "${username}"`, { username })
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || undefined
    const sessionRecord = await createSessionRecord(user.id, user.username, user.role, ip)

    logEvent('info', 'system', `${user.username} logged in`, { username: user.username, role: user.role, ip })
    notifyLogin(user.username, user.role, ip) // fire-and-forget, won't block response

    const response = NextResponse.json({ success: true, role: user.role })
    // Cookie holds only the session ID — the actual session record lives in
    // MongoDB so it can be revoked (kicked) on demand. No maxAge = the cookie
    // is cleared when the browser closes, on top of the 3hr server-side expiry.
    response.cookies.set('bgcheck-session', sessionRecord.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    return response
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Login failed' }, { status: 500 })
  }
}
