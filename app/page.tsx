import { Suspense } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import CheckerForm from '@/components/CheckerForm'

const navLinkStyle = (active: boolean): React.CSSProperties => ({
  fontSize: 13.5,
  color: active ? 'var(--accent-2)' : 'var(--fg-2)',
  fontWeight: active ? 700 : 500,
  textDecoration: 'none',
  padding: '6px 14px',
  borderRadius: 99,
  background: active ? 'var(--blush)' : 'transparent',
})

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-backdrop" />
      <div className="blob" style={{ width: 380, height: 380, background: 'var(--pink)', opacity: 0.3, top: -120, left: -80 }} />
      <div className="blob" style={{ width: 320, height: 320, background: 'var(--lavender-light)', opacity: 0.2, top: 100, right: -100, animationDelay: '2s' }} />

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', backdropFilter: 'blur(16px)', background: 'var(--bg)', opacity: 0.92, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, var(--pink), var(--lavender-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, boxShadow: 'var(--shadow-sm)' }}>
              🔎
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--fg)', letterSpacing: '-0.01em', fontFamily: 'Quicksand, sans-serif' }}>BGCheck</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link href="/" style={navLinkStyle(true)}>Checker</Link>
            <Link href="/database" style={navLinkStyle(false)}>Database</Link>
            <Link href="/logs" style={navLinkStyle(false)}>Logs</Link>
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 6px' }} />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '72px 24px 40px' }}>
          <div className="animate-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 99, padding: '6px 14px 6px 10px', marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-2)', letterSpacing: '0.02em' }}>Live Roblox lookup</span>
          </div>
          <h1 className="animate-in" style={{ animationDelay: '0.05s', fontSize: 52, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, color: 'var(--fg)', marginBottom: 18, fontFamily: 'Quicksand, sans-serif' }}>
            Player Background<br />
            <span className="gradient-text">Check Tool</span>
          </h1>
          <p className="animate-in" style={{ animationDelay: '0.1s', fontSize: 16, color: 'var(--fg-2)', maxWidth: 480, lineHeight: 1.7, marginBottom: 8 }}>
            Background check any Roblox player — groups, friends, badge count — and cross-reference them against your blacklist database in seconds.
          </p>
        </div>
      </div>

      {/* Main */}
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <Suspense>
          <CheckerForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Arisu Background Check E:3.1</span>
          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Powered by Roproxy & Vercel</span>
        </div>
      </footer>
    </div>
  )
}
