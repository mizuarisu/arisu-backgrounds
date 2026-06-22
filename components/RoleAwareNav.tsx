'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type UserRole = 'user' | 'admin' | 'manager'

const navLinkStyle = (active: boolean): React.CSSProperties => ({
  fontSize: 13.5,
  color: active ? 'var(--accent-2)' : 'var(--fg-2)',
  fontWeight: active ? 700 : 500,
  textDecoration: 'none',
  padding: '6px 14px',
  borderRadius: 99,
  background: active ? 'var(--blush)' : 'transparent',
})

const canSee: Record<UserRole, string[]> = {
  user: ['checker'],
  admin: ['checker', 'database', 'logs'],
  manager: ['checker', 'database', 'logs', 'users'],
}

export default function RoleAwareNav({ activePage }: { activePage: 'checker' | 'database' | 'logs' | 'users' }) {
  const [role, setRole] = useState<UserRole | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.role) setRole(data.role)
      })
      .catch(() => {})
  }, [])

  // While role is loading, show nothing extra (avoids a flash of links the
  // user doesn't have access to, then having them disappear).
  if (!role) return null

  const visible = canSee[role]

  return (
    <>
      {visible.includes('checker') && <Link href="/" style={navLinkStyle(activePage === 'checker')}>Checker</Link>}
      {visible.includes('database') && <Link href="/database" style={navLinkStyle(activePage === 'database')}>Database</Link>}
      {visible.includes('logs') && <Link href="/logs" style={navLinkStyle(activePage === 'logs')}>Logs</Link>}
      {visible.includes('users') && <Link href="/admin/users" style={navLinkStyle(activePage === 'users')}>Users</Link>}
    </>
  )
}
