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

export default function DatabaseManager() {
  const [users, setUsers] = useState<BlacklistEntry[]>([])
  const [groups, setGroups] = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [userInput, setUserInput] = useState('')
  const [userSev, setUserSev] = useState<Severity>('medium')
  const [userReason, setUserReason] = useState('')

  const [groupInput, setGroupInput] = useState('')
  const [groupSev, setGroupSev] = useState<Severity>('medium')
  const [groupReason, setGroupReason] = useState('')

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
      setError('')
      setSuccess('')
      const res = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value: value.trim(), name: name.trim(), severity, reason: reason.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add entry')
      }
      setSuccess(`${type === 'user' ? 'User' : 'Group'} added!`)
      setTimeout(() => setSuccess(''), 3000)
      await fetchBlacklist()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add entry')
    }
  }

  const addUser = async () => {
    if (!userInput.trim()) return
    if (/^\d+$/.test(userInput.trim())) {
      await addEntry('user', userInput, '', userSev, userReason)
      setUserInput('')
      setUserReason('')
    } else {
      try {
        const res = await fetch('/api/resolve-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: userInput.trim() }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError('User not found.')
          return
        }
        await addEntry('user', data.id, data.name, userSev, userReason)
        setUserInput('')
        setUserReason('')
      } catch (e) {
        setError('Failed to resolve username.')
      }
    }
  }

  const removeEntry = async (id: string) => {
    try {
      const res = await fetch('/api/database', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to remove')
      setSuccess('Entry removed!')
      setTimeout(() => setSuccess(''), 3000)
      await fetchBlacklist()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove')
    }
  }

  const sevColors: Record<Severity, string> = {
    high: 'text-red-500 bg-red-50 dark:bg-red-950/30',
    medium: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    low: 'text-green-600 bg-green-50 dark:bg-green-950/30',
  }

  if (loading) return <div className="text-center py-8" style={{ color: 'var(--muted)' }}>Loading...</div>

  return (
    <div className="space-y-8">
      {error && (<div className="px-4 py-3 text-sm rounded" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>{error}</div>)}
      {success && (<div className="px-4 py-3 text-sm rounded" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)' }}>{success}</div>)}

      <div>
        <h2 className="text-lg font-semibold mb-4">Blacklisted Users</h2>
        <div className="mb-6 p-4 rounded" style={{ background: 'var(--muted-bg)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Add by Roblox User ID</p>
          <div className="flex gap-2 mb-3">
            <input className="flex-1 min-w-[150px] px-3 py-2 text-sm" placeholder="Username or User ID..." value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addUser()} />
            <select className="px-3 py-2 text-sm" value={userSev} onChange={e => setUserSev(e.target.value as Severity)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 text-sm" placeholder="Reason..." value={userReason} onChange={e => setUserReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && addUser()} />
            <button onClick={addUser} className="px-4 py-2 text-sm font-medium" style={{ background: 'var(--foreground)', color: 'var(--background)', borderRadius: 4 }}>Add</button>
          </div>
        </div>

        {users.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No blacklisted users.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${sevColors[u.severity]}`}>{u.severity}</span>
                    <span className="text-sm font-medium">{u.name ? `${u.name} (${u.value})` : u.value}</span>
                  </div>
                  {u.reason && <p className="text-xs" style={{ color: 'var(--muted)' }}>{u.reason}</p>}
                </div>
                <div className="flex gap-2">
                  <a href={`https://www.roblox.com/users/${u.value}/profile`} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: 'var(--muted)' }}>View</a>
                  <button onClick={() => removeEntry(u.id)} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }} />

      <div>
        <h2 className="text-lg font-semibold mb-4">Blacklisted Groups</h2>
        <div className="mb-6 p-4 rounded" style={{ background: 'var(--muted-bg)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Add by Group ID</p>
          <div className="flex gap-2 mb-3">
            <input className="px-3 py-2 text-sm w-48" placeholder="Group ID..." value={groupInput} onChange={e => setGroupInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEntry('group', groupInput, '', groupSev, groupReason).then(() => { setGroupInput(''); setGroupReason('') })} />
            <select className="px-3 py-2 text-sm" value={groupSev} onChange={e => setGroupSev(e.target.value as Severity)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 text-sm" placeholder="Reason..." value={groupReason} onChange={e => setGroupReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEntry('group', groupInput, '', groupSev, groupReason).then(() => { setGroupInput(''); setGroupReason('') })} />
            <button onClick={() => { addEntry('group', groupInput, '', groupSev, groupReason).then(() => { setGroupInput(''); setGroupReason('') }) }} className="px-4 py-2 text-sm font-medium" style={{ background: 'var(--foreground)', color: 'var(--background)', borderRadius: 4 }}>Add</button>
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No blacklisted groups.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {groups.map(g => (
              <div key={g.id} className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${sevColors[g.severity]}`}>{g.severity}</span>
                    <span className="text-sm font-medium">{g.name ? `${g.name} (${g.value})` : g.value}</span>
                  </div>
                  {g.reason && <p className="text-xs" style={{ color: 'var(--muted)' }}>{g.reason}</p>}
                </div>
                <div className="flex gap-2">
                  <a href={`https://www.roblox.com/groups/${g.value}`} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: 'var(--muted)' }}>View</a>
                  <button onClick={() => removeEntry(g.id)} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
