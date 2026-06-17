import { Suspense } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import CheckerForm from '@/components/CheckerForm'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      {/* Nav */}
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
            <Link href="/" style={{ fontSize: 13, color: 'var(--accent-2)', fontWeight: 500, textDecoration: 'none' }}>Checker</Link>
            <Link href="/database" style={{ fontSize: 13, color: 'var(--fg-2)', textDecoration: 'none', transition: 'color 0.15s' }}>Database</Link>
            <Link href="/logs" style={{ fontSize: 13, color: 'var(--fg-2)', textDecoration: 'none', transition: 'color 0.15s' }}>Logs</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="hero-glow" />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px 48px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-glow)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 99, padding: '4px 12px', marginBottom: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--fg-2)', letterSpacing: '0.05em' }}>LIVE LOOKUP</span>
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'var(--fg)', marginBottom: 16 }}>
            Player Background<br />
            <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Check Tool</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--fg-2)', maxWidth: 500, lineHeight: 1.7, marginBottom: 40 }}>
            Investigate any Roblox player — groups, friends, badge history, and cross-reference against your blacklist database.
          </p>
        </div>
      </div>

      {/* Main */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <Suspense>
          <CheckerForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', marginTop: 40 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--fg-3)' }}>BGCheck v2.0</span>
          <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--fg-3)' }}>roproxy.com</span>
        </div>
      </footer>
    </div>
  )
}
