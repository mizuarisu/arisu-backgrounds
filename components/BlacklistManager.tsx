'use client'
import { useState, useEffect } from 'react'
import { loadBlacklist, saveBlacklist, type Blacklist, type Severity } from '@/lib/blacklist'

export default function BlacklistManager() {
  const [bl, setBl] = useState<Blacklist>({ users: [], groups: [] })
  const [userInput, setUserInput] = useState('')
  const [userSev, setUserSev] = useState<Severity>('medium')
  const [userReason, setUserReason] = useState('')
  const [groupInput, setGroupInput] = useState('')
  const [groupSev, setGroupSev] = useState<Severity>('medium')
  const [groupReason, setGroupReason] = useState('')

  useEffect(() => { setBl(loadBlacklist()) }, [])

  const save = (next: Blacklist) => { setBl(next); saveBlacklist(next) }

  const addUser = () => {
    if (!userInput.trim()) return
    save({ ...bl, users: [...bl.users, { username: userInput.trim().toLowerCase(), severity: userSev, reason: userReason.trim(), addedAt: new Date().toISOString() }] })
    setUserInput(''); setUserReason('')
  }

  const addGroup = () => {
    if (!groupInput.trim() || isNaN(Number(groupInput))) return
    save({ ...bl, groups: [...bl.groups, { id: groupInput.trim(), severity: groupSev, reason: groupReason.trim(), addedAt: new Date().toISOString() }] })
    setGroupInput(''); setGroupReason('')
  }

  const removeUser = (i: number) => save({ ...bl, users: bl.users.filter((_, idx) => idx !== i) })
  const removeGroup = (i: number) => save({ ...bl, groups: bl.groups.filter((_, idx) => idx !== i) })

  const sevColors: Record<Severity, string> = {
    high: 'text-red-500 bg-red-50 dark:bg-red-950/30',
    medium: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    low: 'text-green-600 bg-green-50 dark:bg-green-950/30',
  }

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
            onKeyDown={e => e.key === 'Enter' && addUser()}
          />
          <select
            className="px-3 py-2 text-sm"
            value={userSev}
            onChange={e => setUserSev(e.target.value as Severity)}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input
            className="flex-1 min-w-[120px] px-3 py-2 text-sm"
            placeholder="Reason..."
            value={userReason}
            onChange={e => setUserReason(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addUser()}
          />
          <button
            onClick={addUser}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: 'var(--foreground)', color: 'var(--background)', borderRadius: 4 }}
          >
            Add
          </button>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {bl.users.length === 0 && (
            <p className="text-sm py-3" style={{ color: 'var(--muted)' }}>No blacklisted users.</p>
          )}
          {bl.users.map((u, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${sevColors[u.severity]}`}>{u.severity}</span>
              <span className="text-sm font-medium flex-1">{u.username}</span>
              {u.reason && <span className="text-xs" style={{ color: 'var(--muted)' }}>{u.reason}</span>}
              <a
                href={`https://www.roblox.com/search/users?keyword=${u.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline"
                style={{ color: 'var(--muted)' }}
              >
                Roblox ↗
              </a>
              <button onClick={() => removeUser(i)} className="text-xs hover:opacity-70 transition-opacity" style={{ color: 'var(--muted)' }}>
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
            onKeyDown={e => e.key === 'Enter' && addGroup()}
          />
          <select
            className="px-3 py-2 text-sm"
            value={groupSev}
            onChange={e => setGroupSev(e.target.value as Severity)}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input
            className="flex-1 min-w-[120px] px-3 py-2 text-sm"
            placeholder="Reason..."
            value={groupReason}
            onChange={e => setGroupReason(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGroup()}
          />
          <button
            onClick={addGroup}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: 'var(--foreground)', color: 'var(--background)', borderRadius: 4 }}
          >
            Add
          </button>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {bl.groups.length === 0 && (
            <p className="text-sm py-3" style={{ color: 'var(--muted)' }}>No blacklisted groups.</p>
          )}
          {bl.groups.map((g, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${sevColors[g.severity]}`}>{g.severity}</span>
              <span className="text-sm font-medium font-mono flex-1">{g.id}</span>
              {g.reason && <span className="text-xs" style={{ color: 'var(--muted)' }}>{g.reason}</span>}
              <a
                href={`https://www.roblox.com/groups/${g.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline"
                style={{ color: 'var(--muted)' }}
              >
                Roblox ↗
              </a>
              <button onClick={() => removeGroup(i)} className="text-xs hover:opacity-70 transition-opacity" style={{ color: 'var(--muted)' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
          More database ideas
        </h3>
        <ul className="text-sm space-y-1.5" style={{ color: 'var(--muted)' }}>
          {[
            'Alt account tracker — link known alts to a main account',
            'Incident log — date + description of what happened',
            'Source — who reported them (your team, community report)',
            'Status — under review / confirmed / appealed',
            'Evidence link — attach a screenshot or video URL',
            'Ban history — track if they were banned before and returned',
          ].map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span>—</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
