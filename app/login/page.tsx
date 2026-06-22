'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Session cookie is set automatically by the response
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--pink), var(--lavender-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: 'var(--shadow-md)', margin: '0 auto 16px' }}>
            🔎
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--fg)', marginBottom: 8, fontFamily: 'Quicksand, sans-serif' }}>BGCheck</h1>
          <p style={{ fontSize: 14, color: 'var(--fg-2)' }}>Roblox Background Check Tool</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '12px 14px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 12, color: 'var(--red)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--fg)', marginBottom: 6 }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-2)', color: 'var(--fg)', fontFamily: 'Outfit, sans-serif' }}
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--fg)', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-2)', color: 'var(--fg)', fontFamily: 'Outfit, sans-serif' }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            style={{ padding: '12px 16px', fontSize: 15, fontWeight: 700, background: loading ? 'var(--fg-3)' : 'linear-gradient(135deg, var(--pink), var(--lavender-deep))', color: '#fff', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s', opacity: !username.trim() || !password.trim() ? 0.5 : 1, fontFamily: 'Quicksand, sans-serif' }}
          >
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--fg-3)', textAlign: 'center', marginTop: 20 }}>Contact your administrator for access</p>
      </div>
    </div>
  )
}
