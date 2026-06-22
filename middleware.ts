import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, isSessionValid, canAccess } from './lib/auth'

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Public routes — no auth needed
  const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Get session from cookie
  const sessionCookie = req.cookies.get('bgcheck-session')?.value
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const session = decodeSession(sessionCookie)
  if (!session || !isSessionValid(session)) {
    const response = NextResponse.redirect(new URL('/login', req.url))
    response.cookies.delete('bgcheck-session')
    return response
  }

  // Role-based access control
  let requiredPage: 'checker' | 'database' | 'logs' | 'admin-users' | null = null
  if (pathname === '/' || pathname.startsWith('/api/lookup')) requiredPage = 'checker'
  else if (pathname === '/database' || pathname.startsWith('/api/database')) requiredPage = 'database'
  else if (pathname === '/logs' || pathname.startsWith('/api/logs')) requiredPage = 'logs'
  else if (pathname === '/admin/users' || pathname.startsWith('/api/admin')) requiredPage = 'admin-users'

  if (requiredPage && !canAccess(session.role, requiredPage)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Pass session to downstream routes via headers
  const response = NextResponse.next()
  response.headers.set('x-user-id', session.userId)
  response.headers.set('x-user-name', session.username)
  response.headers.set('x-user-role', session.role)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
