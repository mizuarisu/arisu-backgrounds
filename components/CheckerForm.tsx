'use client'
import { useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const TARGET_GROUP = 4219097
const DIVISION_GROUPS = [812204725, 503346911, 34510781, 8310499, 5336916, 5351323, 5351327, 5336904, 33036871, 5336914]

interface PlayerData {
  user: { id: number; name: string; displayName: string }
  profile: {
    description: string
    created: string
    isBanned: boolean
    hasVerifiedBadge: boolean
    displayName: string
  }
  friends: Array<{ id: number; name: string; displayName: string; thumbnailUrl?: string }>
  groups: Array<{
    group: { id: number; name: string; memberCount: number }
    role: { name: string; rank: number }
  }>
  badges: { total: number; byYear: Record<string, number>; data: Array<{ id: number; name: string; created: string }> }
  accessories: number
  collectibles: number
}

interface BlacklistEntry {
  id: string
  type: 'user' | 'group'
  value: string
  severity: 'high' | 'medium' | 'low'
  reason: string
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
  const [blacklist, setBlacklist] = useState<{ users: BlacklistEntry[]; groups: BlacklistEntry[] }>({ users: [], groups: [] })

  const [showAllFriends, setShowAllFriends] = useState(false)
  const [showAllGroups, setShowAllGroups] = useState(false)

  const runCheck = useCallback(async () => {
    if (!username.trim()) return
    setError('')
    setLoading(true)
    setData(null)
    try {
      const [playerRes, blRes] = await Promise.all([
        fetch(`/api/lookup?username=${encodeURIComponent(username.trim())}`),
        fetch('/api/blacklist'),
      ])
      
      const playerJson = await playerRes.json()
      if (!playerRes.ok) throw new Error(playerJson.error || 'Lookup failed')
      
      const blJson = blRes.ok ? await blRes.json() : { users: [], groups: [] }
      
      setData(playerJson)
      setBlacklist(blJson)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [username])

  const clear = () => { setData(null); setError(''); setUsername(''); setShowAllFriends(false); setShowAllGroups(false) }

  const flaggedFriends = data ? data.friends.filter(f => blacklist.users.find(u => u.value.toLowerCase() === f.name.toLowerCase())) : []
  const flaggedGroups = data ? data.groups.filter(g => blacklist.groups.find(bg => bg.value === String(g.group.id))) : []

  const riskScore = (flaggedFriends.length > 0 ? 2 : 0) + (flaggedGroups.length > 0 ? 3 : 0) + (data?.profile?.isBanned ? 1 : 0)
  const risk = riskScore >= 4 ? 'HIGH RISK' : riskScore >= 1 ? 'CAUTION' : 'CLEAR'
  const riskVariant = riskScore >= 4 ? 'danger' : riskScore >= 1 ? 'warning' : 'success'

  const targetGroup = data?.groups.find(g => g.group.id === TARGET_GROUP)
  const divisionGroups = data?.groups.filter(g => DIVISION_GROUPS.includes(g.group.id)) || []
  const createdDate = data?.profile?.created ? new Date(data.profile.created) : null
  const accountAge = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365)) : null

  const badgeChartData = data ? Object.entries(data.badges.byYear).sort(([a], [b]) => Number(a) - Number(b)).map(([year, count]) => ({ year, badges: count })) : []

  const friendsToShow = showAllFriends ? data?.friends || [] : data?.friends.slice(0, 40) || []
  const groupsToShow = showAllGroups ? data?.groups || [] : data?.groups.slice(0, 25) || []

  const conclusion = data ? [
    `${data.profile?.displayName || data.user.name} (@${data.user.name}) — ID ${data.user.id}`,
    `Account age: ${accountAge !== null ? accountAge + ' year(s)' : 'unknown'} · Status: ${data.profile?.isBanned ? 'BANNED' : 'Active'}`,
    '',
    `Groups: ${data.groups.length} · Friends: ${data.friends.length} · Badges: ${data.badges.total} · Accessories: ${data.accessories}`,
    `Target group (${TARGET_GROUP}): ${targetGroup ? `Member — "${targetGroup.role.name}" (rank ${targetGroup.role.rank})` : 'Not a member'}`,
    divisionGroups.length > 0 ? `Division groups: ${divisionGroups.map(g => g.group.name).join(', ')}` : '',
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
  ].filter(Boolean).join('\n') : ''

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
                const blEntry = blacklist.users.find(u => u.value.toLowerCase() === f.name.toLowerCase())
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
                const blEntry = blacklist.groups.find(bg => bg.value === String(g.group.id))
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

          {/* Division Groups */}
          {divisionGroups.length > 0 && (
            <Section title="Division groups">
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {divisionGroups.map(g => (
                  <div key={g.group.id} className="flex items-center gap-3 py-3">
                    <a
                      href={`https://www.roblox.com/groups/${g.group.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm flex-1 underline underline-offset-2"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {g.group.name}
                    </a>
                    <Badge>{g.role.name}</Badge>
                    <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{g.group.id}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Friends */}
          <Section title={`Friends (${data.friends.length})`}>
            {data.friends.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No friends or profile is private.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-3">
                  {friendsToShow.map(f => {
                    const flagged = flaggedFriends.find(ff => ff.id === f.id)
                    return (
                      <a
                        key={f.id}
                        href={`https://www.roblox.com/users/${f.id}/profile`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative"
                        title={f.name}
                      >
                        <div className={`w-10 h-10 rounded-full overflow-hidden transition-opacity hover:opacity-80 ${flagged ? 'ring-2 ring-red-500' : 'ring-1'}`} style={!flagged ? { ringColor: 'var(--border)' } : {}}>
                          {f.thumbnailUrl ? (
                            <img src={f.thumbnailUrl} alt={f.name} width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-mono" style={{ background: 'var(--muted-bg)', color: 'var(--muted)' }}>
                              {f.name[0]}
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {f.name}
                        </div>
                      </a>
                    )
                  })}
                </div>
                {data.friends.length > 40 && !showAllFriends && (
                  <button
                    onClick={() => setShowAllFriends(true)}
                    className="text-xs mt-3 underline"
                    style={{ color: 'var(--muted)' }}
                  >
                    Show {data.friends.length - 40} more friends
                  </button>
                )}
              </>
            )}
          </Section>

          {/* Groups */}
          <Section title={`Groups (${data.groups.length})`}>
            {data.groups.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No groups.</p>
            ) : (
              <>
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {groupsToShow.map(g => {
                    const flagged = flaggedGroups.find(fg => fg.group.id === g.group.id)
                    const isDivision = DIVISION_GROUPS.includes(g.group.id)
                    return (
                      <div key={g.group.id} className={`flex items-center gap-3 py-3 ${flagged ? 'text-red-700 dark:text-red-400' : ''}`}>
                        {flagged && <span className="text-xs font-mono">⚠</span>}
                        {isDivision && <Badge variant="info">Division</Badge>}
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
                </div>
                {data.groups.length > 25 && !showAllGroups && (
                  <button
                    onClick={() => setShowAllGroups(true)}
                    className="text-xs mt-3 underline"
                    style={{ color: 'var(--muted)' }}
                  >
                    Show {data.groups.length - 25} more groups
                  </button>
                )}
              </>
            )}
          </Section>

          {/* Badges */}
          <Section title="Badges">
            <Row label="Total badges">
              <span className="font-mono text-sm">{data.badges.total}</span>
            </Row>
            {badgeChartData.length > 0 && (
              <div className="mt-4">
                <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Badges acquired by year</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={badgeChartData}>
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12 }}
                      labelStyle={{ color: 'var(--foreground)' }}
                    />
                    <Bar dataKey="badges" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>

          {/* Accessories */}
          <Section title="Accessories & inventory">
            <Row label="Accessories worn"><span className="font-mono text-sm">{data.accessories}</span></Row>
            <Row label="Collectibles (visible)">
              <span className="font-mono text-sm">{data.collectibles}</span>
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
