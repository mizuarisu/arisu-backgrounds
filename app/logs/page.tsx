import { Suspense } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import LogsViewer from '@/components/LogsViewer'

export default function LogsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)', background: 'rgba(13,13,15,0.8)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              🔍
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--fg)', letterSpacing: '-0.01em' }}>BGCheck</span>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', background: 'var(--accent-glow)', color: 'var(--accent-2)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 4, padding: '1px 6px' }}>ROBLOX</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/" style={{ fontSize: 13, color: 'var(--fg-2)', textDecoration: 'none' }}>Checker</Link>
            <Link href="/database" style={{ fontSize: 13, color: 'var(--fg-2)', textDecoration: 'none' }}>Database</Link>
            <Link href="/logs" style={{ fontSize: 13, color: 'var(--accent-2)', fontWeight: 500, textDecoration: 'none' }}>Logs</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: 99, padding: '4px 12px', marginBottom: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', boxShadow: '0 0 6px var(--blue)' }} />
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--fg-2)', letterSpacing: '0.05em' }}>SYSTEM LOGS</span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--fg)', marginBottom: 12 }}>
            Activity Log
          </h1>
          <p style={{ fontSize: 15, color: 'var(--fg-2)', maxWidth: 480 }}>
            Tracks lookups, database changes, and errors across all sessions. Stored server-side in MongoDB.
          </p>
        </div>
        <Suspense>
          <LogsViewer />
        </Suspense>
      </div>
    </div>
  )
}
