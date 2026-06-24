'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import LogoutButton from '@/components/LogoutButton'
import UserGreeting from '@/components/UserGreeting'
import RoleAwareNav from '@/components/RoleAwareNav'

interface User {
  id: string
  username: string
  role: 'user' | 'admin' | 'manager'
  description: string
  createdAt: string
}

interface ActiveSession {
  sessionId: string
  username: string
  role: 'user' | 'admin' | 'manager'
  createdAt: number
  lastSeenAt: number
  expiresAt: number
  isYou: boolean
}

const roleLabel = (role: string) => (role === 'user' ? '👤 User' : role === 'admin' ? '⚙️ Admin' : '🔑 Manager')

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

export default function AdminUsersClient() {
  const [users, setUsers] = useState<User[]>([])
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ username: '', role: 'user' as 'user' | 'admin' | 'manager', description: '' })
  const [creating, setCreating] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [actioningId, setActioningId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    }
  }, [])

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sessions')
      if (!res.ok) throw new Error('Failed to fetch sessions')
      const data = await res.json()
      setSessions(data.sessions)
    } catch (err) {
      // non-fatal, sessions panel just won't populate
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchUsers(), fetchSessions()]).finally(() => setLoading(false))
  }, [fetchUsers, fetchSessions])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setTempPassword('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create user')
      }

      const data = await res.json()
      setTempPassword(data.tempPassword)
      setFormData({ username: '', role: 'user', description: '' })
      setUsers([data.user, ...users])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  const handleRoleChange = async (id: string, newRole: 'user' | 'admin' | 'manager') => {
    setActioningId(id)
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role: newRole }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update role')
      }
      setUsers(users.map(u => (u.id === id ? { ...u, role: newRole } : u)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setActioningId(null)
    }
  }

  const handleRemoveUser = async (id: string, username: string) => {
    if (!confirm(`Remove account "${username}"? This cannot be undone.`)) return
    setActioningId(id)
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove user')
      }
      setUsers(users.filter(u => u.id !== id))
      fetchSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user')
    } finally {
      setActioningId(null)
    }
  }

  const handleKickSession = async (sessionId: string, username: string) => {
    if (!confirm(`Kick ${username}'s session? They'll be logged out immediately.`)) return
    setError('')
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to kick session')
      }
      setSessions(sessions.filter(s => s.sessionId !== sessionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to kick session')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-backdrop" />
      <div className="blob" style={{ width: 360, height: 360, background: 'var(--lavender-light)', opacity: 0.25, top: -100, right: -80 }} />

      <nav style={{ borderBottom: '1px solid var(--border)', backdropFilter: 'blur(16px)', background: 'var(--bg)', opacity: 0.92, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, var(--pink), var(--lavender-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, boxShadow: 'var(--shadow-sm)' }}>
              🔎
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--fg)', letterSpacing: '-0.01em', fontFamily: 'Quicksand, sans-serif' }}>BGCheck</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RoleAwareNav activePage="users" />
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 6px' }} />
            <UserGreeting />
            <LogoutButton />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '64px 24px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 44 }}>
          <div className="animate-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 99, padding: '6px 14px 6px 10px', marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 14 }}>👥</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-2)' }}>User management</span>
          </div>
          <h1 className="animate-in" style={{ animationDelay: '0.05s', fontSize: 42, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--fg)', marginBottom: 12, fontFamily: 'Quicksand, sans-serif' }}>
            Manage Users
          </h1>
          <p className="animate-in" style={{ animationDelay: '0.1s', fontSize: 15, color: 'var(--fg-2)', maxWidth: 480 }}>
            Create accounts, assign roles, and manage active sessions.
          </p>
        </div>

        {error && (
          <div style={{ padding: '14px 18px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 16, color: 'var(--red)', fontSize: 14, marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Create User Form */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginBottom: 28, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)', marginBottom: 16 }}>Create New User</h2>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--fg)', marginBottom: 6 }}>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  disabled={creating}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-2)', color: 'var(--fg)' }}
                  placeholder="e.g. john"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--fg)', marginBottom: 6 }}>Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' | 'manager' })}
                  disabled={creating}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-2)', color: 'var(--fg)' }}
                >
                  <option value="user">User (Checker only)</option>
                  <option value="admin">Admin (+ Database, Logs)</option>
                  <option value="manager">Manager (+ User management)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--fg)', marginBottom: 6 }}>Description <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>(optional — helps tell accounts apart)</span></label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                disabled={creating}
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-2)', color: 'var(--fg)' }}
                placeholder="e.g. Sarah, moderation team"
              />
            </div>

            {tempPassword && (
              <div style={{ padding: 12, background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 10, color: 'var(--green)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>✓ User created! Share this temp password:</div>
                <div style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all', background: 'var(--bg-2)', padding: 8, borderRadius: 6, marginBottom: 8 }}>{tempPassword}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>User should change password after first login.</div>
              </div>
            )}

            <button
              type="submit"
              disabled={creating || !formData.username.trim()}
              style={{ padding: '11px 16px', fontSize: 14, fontWeight: 700, background: creating ? 'var(--fg-3)' : 'linear-gradient(135deg, var(--pink), var(--lavender-deep))', color: '#fff', border: 'none', borderRadius: 10, cursor: creating ? 'not-allowed' : 'pointer', opacity: !formData.username.trim() ? 0.5 : 1 }}
            >
              {creating ? 'Creating…' : 'Create User'}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-sm)', marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)', marginBottom: 16 }}>All Users ({users.length})</h2>
          {loading ? (
            <p style={{ color: 'var(--fg-3)' }}>Loading…</p>
          ) : users.length === 0 ? (
            <p style={{ color: 'var(--fg-3)' }}>No users yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {users.map(user => (
                <div key={user.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{user.username}</div>
                    {user.description && <div style={{ fontSize: 12.5, color: 'var(--fg-2)', marginTop: 2 }}>{user.description}</div>}
                    <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value as 'user' | 'admin' | 'manager')}
                      disabled={actioningId === user.id}
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 99, padding: '5px 10px', cursor: 'pointer' }}
                    >
                      <option value="user">👤 User</option>
                      <option value="admin">⚙️ Admin</option>
                      <option value="manager">🔑 Manager</option>
                    </select>
                    <button
                      onClick={() => handleRemoveUser(user.id, user.username)}
                      disabled={actioningId === user.id}
                      title={user.role === 'manager' ? 'Managers can only be removed by themselves' : 'Remove this account'}
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--red)', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 99, padding: '5px 12px', cursor: actioningId === user.id ? 'not-allowed' : 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>Active Sessions ({sessions.length})</h2>
          <p style={{ fontSize: 12.5, color: 'var(--fg-3)', marginBottom: 16 }}>Kick a session to log that device out immediately, without removing the account.</p>
          {loading ? (
            <p style={{ color: 'var(--fg-3)' }}>Loading…</p>
          ) : sessions.length === 0 ? (
            <p style={{ color: 'var(--fg-3)' }}>No active sessions.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sessions.map(s => (
                <div key={s.sessionId} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.username}
                      {s.isYou && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-2)', background: 'var(--blush)', padding: '2px 8px', borderRadius: 99 }}>you</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>
                      {roleLabel(s.role)} · last active {timeAgo(s.lastSeenAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleKickSession(s.sessionId, s.username)}
                    style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--amber)', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: 99, padding: '5px 12px', cursor: 'pointer' }}
                  >
                    Kick
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
