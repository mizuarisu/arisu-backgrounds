'use client'
import { useState, useCallback } from 'react'
import { loadBlacklist } from '@/lib/blacklist'

const TARGET_GROUP = 4219097

interface PlayerData {
  user: { id: number; name: string; displayName: string }
  profile: {
    description: string
    created: string
    isBanned: boolean
    hasVerifiedBadge: boolean
    displayName: string
  }
  friends: Array<{ id: number; name: string; displayName: string }>
  groups: Array<{
    group: { id: number; name: string; memberCount: number }
    role: { name: string; rank: number }
  }>
  badges: { total: number; byYear: Record<string, number> }
  accessories: number
  collectibles: number
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' }) {
  const styles = {
    default: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
    success: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400',
    danger: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    info: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  }
  return (
    <span className={`inline-flex items-center text-xs font-mono px-2 py-0.5 rounded ${styles[variant]}`}>
      {children}
    </span>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-3 text-sm" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="w-44 shrink-0 text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="flex-1 flex flex-wrap gap-2 items-start">{children}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function CheckerForm() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<PlayerData | null>(null)

  const runCheck = useCallback(async () => {
    if (!username.trim()) return
    setError('')
    setLoading(true)
    setData(null)
    try {
      const res = await fetch(`/api/lookup?username=${encodeURIComponent(username.trim())}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Lookup failed')
      setData(json)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [username])

  const clear = () => { setData(null); setError(''); setUsername('') }

  const bl = loadBlacklist()

  const flaggedFriends = data ? data.friends.filter(f => bl.users.find(u => u.username === f.name.toLowerCase())) : []
  const flaggedGroups = data ? data.groups.filter(g => bl.groups.find(bg => bg.id === String(g.group.id))) : []

  const riskScore = (flaggedFriends.length > 0 ? 2 : 0) + (flaggedGroups.length > 0 ? 3 : 0) + (data?.profile?.isBanned ? 1 : 0)
  const risk = riskScore >= 4 ? 'HIGH RISK' : riskScore >= 1 ? 'CAUTION' : 'CLEAR'
  const riskVariant = riskScore >= 4 ? 'danger' : riskScore >= 1 ? 'warning' : 'success'

  const targetGroup = data?.groups.find(g => g.group.id === TARGET_GROUP)
  const createdDate = data?.profile?.created ? new Date(data.profile.created) : null
  const accountAge = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365)) : null

  const conclusion = data ? [
    `${data.profile?.displayName || data.user.name} (@${data.user.name}) — ID ${data.user.id}`,
    `Account age: ${accountAge !== null ? accountAge + ' year(s)' : 'unknown'} · Status: ${data.profile?.isBanned ? 'BANNED' : 'Active'}`,
    '',
    `Groups: ${data.groups.length} · Friends: ${data.friends.length} · Badges: ${data.badges.total}${data.badges.total === 100 ? '+' : ''} · Accessories: ${data.accessories}`,
    `Target group (${TARGET_GROUP}): ${targetGroup ? `Member — "${targetGroup.role.name}" (rank ${targetGroup.role.rank})` : 'Not a member'}`,
    '',
    flaggedFriends.length > 0
      ? `⚠ BLACKLISTED FRIENDS (${flaggedFriends.length}): ${flaggedFriends.map(f => f.name).join(', ')}\n${flaggedFriends.map(f => `  → https://www.roblox.com/users/${f.id}/profile`).join('\n')}`
      : 'No blacklisted friends.',
    flaggedGroups.length > 0
      ? `⚠ BLACKLISTED GROUPS (${flaggedGroups.length}): ${flaggedGroups.map(g => g.group.name).join(', ')}\n${flaggedGroups.map(g => `  → https://www.roblox.com/groups/${g.group.id}`).join('\n')}`
      : 'No blacklisted groups.',
    '',
    `Overall risk: ${risk}`,
    riskScore >= 4 ? 'Recommendation: Exercise extreme caution. Multiple flagged associations.'
      : riskScore >= 1 ? 'Recommendation: Review flagged associations before proceeding.'
      : 'Recommendation: No red flags detected based on current blacklist.',
  ].join('\n') : ''

  return (
    <div>
      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 px-4 py-3 text-sm"
          placeholder="Enter Roblox username..."
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runCheck()}
          disabled={loading}
        />
        <button
          onClick={runCheck}
          disabled={loading || !username.trim()}
          className="px-5 py-3 text-sm font-medium transition-opacity disabled:opacity-40"
          style={{ background: 'var(--foreground)', color: 'var(--background)', borderRadius: 4 }}
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
        {data && (
          <button
            onClick={clear}
            className="px-4 py-3 text-sm transition-colors"
            style={{ border: '1px solid var(--border)', borderRadius: 4, color: 'var(--muted)' }}
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 text-sm rounded" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid currentColor', borderColor: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--muted)' }}>
          <div className="inline-flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Fetching player data...
          </div>
        </div>
      )}

      {data && (
        <div>
          {/* Flagged banners */}
          {(flaggedFriends.length > 0 || flaggedGroups.length > 0) && (
            <div className="mb-8 space-y-2">
              {flaggedFriends.map(f => {
                const blEntry = bl.users.find(u => u.username === f.name.toLowerCase())
                return (
                  <div key={f.id} className="flex items-start gap-3 px-4 py-3 rounded text-sm" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)', color: 'var(--warning)' }}>
                    <span className="font-mono text-xs mt-0.5">⚠</span>
                    <span>
                      <strong>Flagged friend:</strong> {f.name}{blEntry?.reason ? ` — ${blEntry.reason}` : ''}{' '}
                      <a href={`https://www.roblox.com/users/${f.id}/profile`} target="_blank" rel="noopener noreferrer" className="underline">
                        View profile ↗
                      </a>
                    </span>
                  </div>
                )
              })}
              {flaggedGroups.map(g => {
                const blEntry = bl.groups.find(bg => bg.id === String(g.group.id))
                return (
                  <div key={g.group.id} className="flex items-start gap-3 px-4 py-3 rounded text-sm" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                    <span className="font-mono text-xs mt-0.5">⚠</span>
                    <span>
                      <strong>Flagged group:</strong> {g.group.name} (ID: {g.group.id}){blEntry?.reason ? ` — ${blEntry.reason}` : ''}{' '}
                      <a href={`https://www.roblox.com/groups/${g.group.id}`} target="_blank" rel="noopener noreferrer" className="underline">
                        View group ↗
                      </a>
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Profile */}
          <Section title="Profile">
            <div className="flex items-start gap-4 mb-4">
              <img
                src={`https://www.roblox.com/headshot-thumbnail/image?userId=${data.user.id}&width=100&height=100&format=png`}
                alt="avatar"
                width={52}
                height={52}
                className="rounded-full shrink-0"
                style={{ border: '1px solid var(--border)' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl font-semibold">{data.profile?.displayName || data.user.name}</span>
                  <Badge variant={riskVariant}>{risk}</Badge>
                  {data.profile?.isBanned && <Badge variant="danger">Banned</Badge>}
                  {data.profile?.hasVerifiedBadge && <Badge variant="info">Verified</Badge>}
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  @{data.user.name} · ID: {data.user.id}
                </div>
                <a
                  href={`https://www.roblox.com/users/${data.user.id}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline mt-1 inline-block"
                  style={{ color: 'var(--muted)' }}
                >
                  View on Roblox ↗
                </a>
              </div>
            </div>
            <Row label="Account created">
              {createdDate ? createdDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </Row>
            <Row label="Account age">
              {accountAge !== null ? `${accountAge} year(s)` : '—'}
            </Row>
            <Row label="Bio">
              {data.profile?.description
                ? <span className="whitespace-pre-wrap">{data.profile.description}</span>
                : <span style={{ color: 'var(--muted)' }}>No bio</span>}
            </Row>
          </Section>

          {/* Target Group */}
          <Section title={`Group rank — ${TARGET_GROUP}`}>
            {targetGroup ? (
              <Row label={targetGroup.group.name}>
                <Badge variant="info">{targetGroup.role.name}</Badge>
                <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>rank {targetGroup.role.rank}</span>
              </Row>
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Player is not a member of group {TARGET_GROUP}.
              </p>
            )}
          </Section>

          {/* Friends */}
          <Section title={`Friends (${data.friends.length})`}>
            {data.friends.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No friends or profile is private.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.friends.slice(0, 40).map(f => {
                  const flagged = flaggedFriends.find(ff => ff.id === f.id)
                  return (
                    <a
                      key={f.id}
                      href={`https://www.roblox.com/users/${f.id}/profile`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-opacity hover:opacity-70 ${flagged ? 'text-red-700 dark:text-red-400' : ''}`}
                      style={flagged
                        ? { background: 'var(--danger-bg)', border: '1px solid var(--danger)' }
                        : { border: '1px solid var(--border)', color: 'var(--muted)' }}
                    >
                      {flagged && <span>⚠</span>}
                      {f.displayName || f.name}
                    </a>
                  )
                })}
                {data.friends.length > 40 && (
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>
                    +{data.friends.length - 40} more
                  </span>
                )}
              </div>
            )}
          </Section>

          {/* Groups */}
          <Section title={`Groups (${data.groups.length})`}>
            {data.groups.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No groups.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {data.groups.slice(0, 25).map(g => {
                  const flagged = flaggedGroups.find(fg => fg.group.id === g.group.id)
                  return (
                    <div key={g.group.id} className={`flex items-center gap-3 py-3 ${flagged ? 'text-red-700 dark:text-red-400' : ''}`}>
                      {flagged && <span className="text-xs font-mono">⚠</span>}
                      <a
                        href={`https://www.roblox.com/groups/${g.group.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm flex-1 underline underline-offset-2"
                        style={flagged ? {} : { color: 'var(--foreground)' }}
                      >
                        {g.group.name}
                      </a>
                      <Badge>{g.role.name}</Badge>
                      <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{g.group.id}</span>
                    </div>
                  )
                })}
                {data.groups.length > 25 && (
                  <p className="text-xs pt-3" style={{ color: 'var(--muted)' }}>+{data.groups.length - 25} more groups</p>
                )}
              </div>
            )}
          </Section>

          {/* Badges */}
          <Section title="Badges">
            <Row label="Total badges">
              <span className="font-mono text-sm">{data.badges.total}{data.badges.total === 100 ? '+' : ''}</span>
            </Row>
            <Row label="By year (created)">
              <span className="text-sm font-mono" style={{ color: 'var(--muted)' }}>
                {Object.keys(data.badges.byYear).length === 0
                  ? 'No data'
                  : Object.entries(data.badges.byYear).sort(([a], [b]) => Number(a) - Number(b)).map(([yr, count]) => `${yr}: ${count}`).join(' · ')}
              </span>
            </Row>
          </Section>

          {/* Accessories */}
          <Section title="Accessories & inventory">
            <Row label="Accessories worn"><span className="font-mono text-sm">{data.accessories}</span></Row>
            <Row label="Collectibles (visible)">
              <span className="font-mono text-sm">{data.collectibles}{data.collectibles === 100 ? '+' : ''}</span>
            </Row>
          </Section>

          {/* Conclusion */}
          <Section title="Conclusion">
            <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono p-4 rounded" style={{ background: 'var(--muted-bg)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
              {conclusion}
            </pre>
          </Section>
        </div>
      )}
    </div>
  )
}
