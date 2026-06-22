'use client'
import { Suspense } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import DatabaseManager from '@/components/DatabaseManager'

export const dynamic = 'force-dynamic'

const navLinkStyle = (active: boolean): React.CSSProperties => ({
  fontSize: 13.5,
  color: active ? 'var(--accent-2)' : 'var(--fg-2)',
  fontWeight: active ? 700 : 500,
  textDecoration: 'none',
  padding: '6px 14px',
  borderRadius: 99,
  background: active ? 'var(--blush)' : 'transparent',
})

export default function DatabasePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-backdrop" />
      <div className="blob" style={{ width: 360, height: 360, background: 'var(--lavender-light)', opacity: 0.25, top: -100, right: -80 }} />
      <div className="blob" style={{ width: 280, height: 280, background: 'var(--pink)', opacity: 0.25, top: 200, left: -100, animationDelay: '3s' }} />

      <nav style={{ borderBottom: '1px solid var(--border)', backdropFilter: 'blur(16px)', background: 'var(--bg)', opacity: 0.92, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, var(--pink), var(--lavender-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, boxShadow: 'var(--shadow-sm)' }}>
              🔎
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--fg)', letterSpacing: '-0.01em', fontFamily: 'Quicksand, sans-serif' }}>BGCheck</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link href="/" style={navLinkStyle(false)}>Checker</Link>
            <Link href="/database" style={navLinkStyle(true)}>Database</Link>
            <Link href="/logs" style={navLinkStyle(false)}>Logs</Link>
            <Link href="/admin/users" style={navLinkStyle(false)}>Users</Link>
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 6px' }} />
            <button onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.href = '/login') }} style={{ fontSize: 13.5, color: 'var(--fg-2)', fontWeight: 500, textDecoration: 'none', padding: '6px 14px', borderRadius: 99, background: 'transparent', border: 'none', cursor: 'pointer' }}>Logout</button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '64px 24px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 44 }}>
          <div className="animate-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 99, padding: '6px 14px 6px 10px', marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 14 }}>🗂️</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-2)' }}>Blacklist database</span>
          </div>
          <h1 className="animate-in" style={{ animationDelay: '0.05s', fontSize: 42, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--fg)', marginBottom: 12, fontFamily: 'Quicksand, sans-serif' }}>
            Manage Database
          </h1>
          <p className="animate-in" style={{ animationDelay: '0.1s', fontSize: 15, color: 'var(--fg-2)', maxWidth: 480 }}>
            All entries are shared across sessions and persist server-side in MongoDB.
          </p>
        </div>
        <Suspense>
          <DatabaseManager />
        </Suspense>
      </div>
    </div>
  )
}
