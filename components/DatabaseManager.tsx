'use client'
import { useState, useEffect } from 'react'

type Severity = 'high' | 'medium' | 'low'

interface BlacklistEntry {
  id: string
  type: 'user' | 'group'
  value: string
  name?: string
  severity: Severity
  reason: string
  addedAt: string
}

function Chip({ children, color = 'default' }: { children: React.ReactNode; color?: 'default' | 'green' | 'red' | 'amber' | 'blue' | 'indigo' }) {
  const map = {
    default: { bg: 'var(--bg-4)', color: 'var(--fg-2)', border: 'var(--border)' },
    green:   { bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green-border)' },
    red:     { bg: 'var(--red-bg)', color: 'var(--red)', border: 'var(--red-border)' },
    amber:   { bg: 'var(--amber-bg)', color: 'var(--amber)', border: 'var(--amber-border)' },
    blue:    { bg: 'var(--blue-bg)', color: 'var(--blue)', border: 'var(--blue-border)' },
    indigo:  { bg: 'var(--accent-glow)', color: 'var(--accent-2)', border: 'rgba(99,102,241,0.3)' },
  }
  const s = map[color]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
      {children}
    </span>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, ...style }}>{children}</div>
}

function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{children}</span>
      {count !== undefined && <Chip>{count}</Chip>}
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

const sevColor: Record<Severity, 'red' | 'amber' | 'green'> = { high: 'red', medium: 'amber', low: 'green' }

export default function DatabaseManager() {
  const [users, setUsers] = useState<BlacklistEntry[]>([])
  const [groups, setGroups] = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [userInput, setUserInput] = useState('')
  const [userSev, setUserSev] = useState<Severity>('medium')
  const [userReason, setUserReason] = useState('')
  const [addingUser, setAddingUser] = useState(false)

  const [groupInput, setGroupInput] = useState('')
  const [groupSev, setGroupSev] = useState<Severity>('medium')
  const [groupReason, setGroupReason] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)

  const fetchBlacklist = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/database')
      if (!res.ok) throw new Error('Failed to load database')
      const data = await res.json()
      setUsers(data.users || [])
      setGroups(data.groups || [])
      setError('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load database')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBlacklist() }, [])

  const addEntry = async (type: 'user' | 'group', value: string, name: string, severity: Severity, reason: string) => {
    if (!value.trim()) return
    try {
      setError(''); setSuccess('')
      const res = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value: value.trim(), name: name.trim(), severity, reason: reason.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add entry')
      }
      setSuccess(`${type === 'user' ? 'User' : 'Group'} added to blacklist`)
      setTimeout(() => setSuccess(''), 3000)
      await fetchBlacklist()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add entry')
    }
  }

  const addUser = async () => {
    if (!userInput.trim()) return
    setAddingUser(true)
    try {
      if (/^\d+$/.test(userInput.trim())) {
        await addEntry('user', userInput, '', userSev, userReason)
      } else {
        const res = await fetch('/api/resolve-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: userInput.trim() }),
        })
        const data = await res.json()
        if (!res.ok) { setError('User not found.'); setAddingUser(false); return }
        await addEntry('user', data.id, data.name, userSev, userReason)
      }
      setUserInput(''); setUserReason('')
    } catch {
      setError('Failed to resolve username.')
    } finally {
      setAddingUser(false)
    }
  }

  const addGroup = async () => {
    if (!groupInput.trim()) return
    setAddingGroup(true)
    await addEntry('group', groupInput, '', groupSev, groupReason)
    setGroupInput(''); setGroupReason('')
    setAddingGroup(false)
  }

  const removeEntry = async (id: string) => {
    try {
      const res = await fetch('/api/database', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to remove')
      setSuccess('Entry removed')
      setTimeout(() => setSuccess(''), 3000)
      await fetchBlacklist()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove')
    }
  }

  const inputStyle: React.CSSProperties = { padding: '10px 14px', fontSize: 14, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-3)' }
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
  const btnStyle: React.CSSProperties = { padding: '10px 18px', fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', whiteSpace: 'nowrap' }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 10, color: 'var(--red)', fontSize: 13 }}>{error}</div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 10, color: 'var(--green)', fontSize: 13 }}>✓ {success}</div>
      )}

      {/* Users */}
      <Card>
        <SectionLabel count={users.length}>Blacklisted Users</SectionLabel>

        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 10 }}>Add by username or Roblox User ID</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <input style={{ ...inputStyle, flex: 1, minWidth: 160 }} placeholder="Username or User ID…" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addUser()} />
            <select style={selectStyle} value={userSev} onChange={e => setUserSev(e.target.value as Severity)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Reason…" value={userReason} onChange={e => setUserReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && addUser()} />
            <button style={{ ...btnStyle, opacity: addingUser ? 0.6 : 1 }} disabled={addingUser} onClick={addUser}>{addingUser ? 'Adding…' : 'Add'}</button>
          </div>
        </div>

        {users.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--fg-3)', fontStyle: 'italic' }}>No blacklisted users.</p>
        ) : (
          <div>
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <Chip color={sevColor[u.severity]}>{u.severity}</Chip>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{u.name ? `${u.name} (${u.value})` : u.value}</div>
                  {u.reason && <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{u.reason}</div>}
                </div>
                <a href={`https://www.roblox.com/users/${u.value}/profile`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent-2)', textDecoration: 'none' }}>View</a>
                <button onClick={() => removeEntry(u.id)} style={{ fontSize: 12, padding: '5px 10px', background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', borderRadius: 6, cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Groups */}
      <Card>
        <SectionLabel count={groups.length}>Blacklisted Groups</SectionLabel>

        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 10 }}>Add by Group ID</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <input style={{ ...inputStyle, width: 180 }} placeholder="Group ID…" value={groupInput} onChange={e => setGroupInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGroup()} />
            <select style={selectStyle} value={groupSev} onChange={e => setGroupSev(e.target.value as Severity)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Reason…" value={groupReason} onChange={e => setGroupReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGroup()} />
            <button style={{ ...btnStyle, opacity: addingGroup ? 0.6 : 1 }} disabled={addingGroup} onClick={addGroup}>{addingGroup ? 'Adding…' : 'Add'}</button>
          </div>
        </div>

        {groups.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--fg-3)', fontStyle: 'italic' }}>No blacklisted groups.</p>
        ) : (
          <div>
            {groups.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <Chip color={sevColor[g.severity]}>{g.severity}</Chip>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{g.name ? `${g.name} (${g.value})` : g.value}</div>
                  {g.reason && <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{g.reason}</div>}
                </div>
                <a href={`https://www.roblox.com/groups/${g.value}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent-2)', textDecoration: 'none' }}>View</a>
                <button onClick={() => removeEntry(g.id)} style={{ fontSize: 12, padding: '5px 10px', background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', borderRadius: 6, cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
