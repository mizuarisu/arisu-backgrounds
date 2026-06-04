import { Suspense } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import DatabaseManager from '@/components/DatabaseManager'

export default function DatabasePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <header style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Roblox</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span className="text-sm font-semibold tracking-tight">Background Check</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-mono uppercase tracking-widest transition-opacity hover:opacity-80" style={{ color: 'var(--muted)' }}>Checker</Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-16" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '3rem' }}>
          <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>Management</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-4">Blacklist Database</h1>
          <p className="text-base max-w-xl" style={{ color: 'var(--muted)' }}>Add or remove players and groups from your blacklist. All data is stored on your server.</p>
        </div>

        <Suspense>
          <DatabaseManager />
        </Suspense>
      </main>

      <footer className="mt-24" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>Roblox Background Check</span>
          <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>Local Database</span>
        </div>
      </footer>
    </div>
  )
}
