import { NextRequest, NextResponse } from 'next/server'

// IMPORTANT: Next.js Middleware runs on the Edge Runtime, which cannot use the
// MongoDB Node.js driver (it depends on Node's `net`/`crypto` core modules).
// So this middleware only does a cheap "is there a session cookie at all"
// check and redirects to /login if not. The REAL validation — confirming the
// session exists in MongoDB, hasn't expired, hasn't been kicked, and the
// role has permission for this page — happens inside each page/API route
// itself (via lib/session-guard.ts), since those run on the Node.js runtime.
export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  const sessionCookie = req.cookies.get('bgcheck-session')?.value
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
