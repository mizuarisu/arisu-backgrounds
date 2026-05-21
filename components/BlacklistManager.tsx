'use client'
import { useState, useEffect } from 'react'

type Severity = 'high' | 'medium' | 'low'

interface BlacklistEntry {
  id: string
  type: 'user' | 'group'
  value: string
  severity: Severity
  reason: string
  addedAt: string
}

export default function BlacklistManager() {
  const [users, setUsers] = useState<BlacklistEntry[]>([])
  const [groups, setGroups] = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [userInput, setUserInput] = useState('')
  const [userSev, setUserSev] = useState<Severity>('medium')
  const [userReason, setUserReason] = useState('')

  const [groupInput, setGroupInput] = useState('')
  const [groupSev, setGroupSev] = useState<Severity>('medium')
  const [groupReason, setGroupReason] = useState('')

  const fetchBlacklist = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/blacklist')
      if (!res.ok) throw new Error('Failed to load blacklist')
      const data = await res.json()
      setUsers(data.users || [])
      setGroups(data.groups || [])
      setError('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load blacklist')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBlacklist() }, [])

  const addEntry = async (type: 'user' | 'group', value: string, severity: Severity, reason: string) => {
    if (!value.trim()) return
    try {
      const res = await fetch('/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value: value.trim(), severity, reason: reason.trim() }),
      })
      if (!res.ok) throw new Error('Failed to add entry')
      await fetchBlacklist()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to add entry')
    }
  }

  const removeEntry = async (cardId: string) => {
    try {
      const res = await fetch('/api/blacklist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      })
      if (!res.ok) throw new Error('Failed to remove entry')
      await fetchBlacklist()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to remove entry')
    }
  }

  const sevColors: Record<Severity, string> = {
    high: 'text-red-500 bg-red-50 dark:bg-red-950/30',
    medium: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    low: 'text-green-600 bg-green-50 dark:bg-green-950/30',
  }

  if (loading) return <div className="text-sm" style={{ color: 'var(--muted)' }}>Loading blacklist...</div>
  if (error) return <div className="text-sm text-red-500">{error}</div>

  return (
    <div className="space-y-8">
      {/* Users */}
      <div>
        <h3 className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
          Blacklisted usernames
        </h3>
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="flex-1 min-w-[140px] px-3 py-2 text-sm"
            placeholder="Username..."
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEntry('user', userInput, userSev, userReason).then(() => { setUserInput(''); setUserReason('') })}
          />
          <select className="px-3 py-2 text-sm" value={userSev} onChange={e => setUserSev(e.target.value as Severity)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input
            className="flex-1 min-w-[120px] px-3 py-2 text-sm"
            placeholder="Reason..."
            value={userReason}
            onChange={e => setUserReason(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEntry('user', userInput, userSev, userReason).then(() => { setUserInput(''); setUserReason('') })}
          />
          <button
            onClick={() => addEntry('user', userInput, userSev, userReason).then(() => { setUserInput(''); setUserReason('') })}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: 'var(--foreground)', color: 'var(--background)', borderRadius: 4 }}
          >
            Add
          </button>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {users.length === 0 && (
            <p className="text-sm py-3" style={{ color: 'var(--muted)' }}>No blacklisted users.</p>
          )}
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 py-3">
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${sevColors[u.severity]}`}>{u.severity}</span>
              <span className="text-sm font-medium flex-1">{u.value}</span>
              {u.reason && <span className="text-xs" style={{ color: 'var(--muted)' }}>{u.reason}</span>}
              <a
                href={`https://www.roblox.com/search/users?keyword=${u.value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline"
                style={{ color: 'var(--muted)' }}
              >
                Roblox ↗
              </a>
              <button onClick={() => removeEntry(u.id)} className="text-xs hover:opacity-70 transition-opacity" style={{ color: 'var(--muted)' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* Groups */}
      <div>
        <h3 className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
          Blacklisted group IDs
        </h3>
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="px-3 py-2 text-sm w-32"
            placeholder="Group ID..."
            value={groupInput}
            onChange={e => setGroupInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEntry('group', groupInput, groupSev, groupReason).then(() => { setGroupInput(''); setGroupReason('') })}
          />
          <select className="px-3 py-2 text-sm" value={groupSev} onChange={e => setGroupSev(e.target.value as Severity)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input
            className="flex-1 min-w-[120px] px-3 py-2 text-sm"
            placeholder="Reason..."
            value={groupReason}
            onChange={e => setGroupReason(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEntry('group', groupInput, groupSev, groupReason).then(() => { setGroupInput(''); setGroupReason('') })}
          />
          <button
            onClick={() => addEntry('group', groupInput, groupSev, groupReason).then(() => { setGroupInput(''); setGroupReason('') })}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: 'var(--foreground)', color: 'var(--background)', borderRadius: 4 }}
          >
            Add
          </button>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {groups.length === 0 && (
            <p className="text-sm py-3" style={{ color: 'var(--muted)' }}>No blacklisted groups.</p>
          )}
          {groups.map(g => (
            <div key={g.id} className="flex items-center gap-3 py-3">
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${sevColors[g.severity]}`}>{g.severity}</span>
              <span className="text-sm font-medium font-mono flex-1">{g.value}</span>
              {g.reason && <span className="text-xs" style={{ color: 'var(--muted)' }}>{g.reason}</span>}
              <a
                href={`https://www.roblox.com/groups/${g.value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline"
                style={{ color: 'var(--muted)' }}
              >
                Roblox ↗
              </a>
              <button onClick={() => removeEntry(g.id)} className="text-xs hover:opacity-70 transition-opacity" style={{ color: 'var(--muted)' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
