import { Suspense } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import CheckerForm from '@/components/CheckerForm'
import BlacklistManager from '@/components/BlacklistManager'

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Roblox
            </span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span className="text-sm font-semibold tracking-tight">Background Check</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-16" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '3rem' }}>
          <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
            Player lookup
          </p>
          <h1 className="text-4xl font-semibold tracking-tight mb-4">
            Background Check
          </h1>
          <p className="text-base max-w-xl" style={{ color: 'var(--muted)' }}>
            Look up any Roblox player to view their profile, group memberships, badge history, friends, and check against your blacklist database.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-16">
          {/* Left — Checker */}
          <div>
            <div className="mb-8">
              <h2 className="text-xs font-mono uppercase tracking-widest mb-6" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                Player lookup
              </h2>
              <Suspense>
                <CheckerForm />
              </Suspense>
            </div>
          </div>

          {/* Right — Blacklist */}
          <div>
            <div className="lg:sticky lg:top-8">
              <h2 className="text-xs font-mono uppercase tracking-widest mb-6" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                Blacklist database
              </h2>
              <Suspense>
                <BlacklistManager />
              </Suspense>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
            Roblox Background Check
          </span>
          <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
            Data via roproxy.com
          </span>
        </div>
      </footer>
    </div>
  )
}
