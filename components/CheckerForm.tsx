'use client'
import { useState, useCallback, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import html2canvas from 'html2canvas'

const TARGET_GROUP = 4219097
const DIVISION_GROUPS = [812204725, 503346911, 34510781, 8310499, 5336916, 5351323, 5351327, 5336904, 33036871, 5336914]

interface PlayerData {
  user: { id: number; name: string; displayName: string }
  profile: { description: string; created: string; isBanned: boolean; hasVerifiedBadge: boolean; displayName: string }
  profileAvatarUrl: string | null
  friends: Array<{ id: number; name: string; displayName: string; thumbnailUrl: string | null }>
  groups: Array<{ group: { id: number; name: string; memberCount: number }; role: { name: string; rank: number } }>
  badges: { total: number; byYear: Record<string, number> }
  accessories: number
  collectibles: number
}

interface BlacklistEntry {
  id: string; type: 'user' | 'group'; value: string; name?: string
  severity: 'high' | 'medium' | 'low'; reason: string
}

// ── Atoms ────────────────────────────────────────────────────
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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, letterSpacing: '0.1em', color: 'var(--fg-3)', textTransform: 'uppercase' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start', fontSize: 14 }}>
      <span style={{ width: 160, flexShrink: 0, color: 'var(--fg-3)', fontSize: 13 }}>{label}</span>
      <span style={{ flex: 1, color: 'var(--fg)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>{children}</span>
    </div>
  )
}

function AvatarImg({ src, name, size = 40, flagged = false }: { src: string | null; name: string; size?: number; flagged?: boolean }) {
  const [err, setErr] = useState(false)
  const initials = name[0]?.toUpperCase() || '?'
  const ring = flagged ? `0 0 0 2px var(--red)` : 'none'
  if (src && !err) {
    return <img src={src} alt={name} width={size} height={size} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', boxShadow: ring, border: '1px solid var(--border)' }} onError={() => setErr(true)} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, var(--bg-4), var(--bg-3))', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size > 40 ? 18 : 12, color: 'var(--fg-2)', fontWeight: 600, boxShadow: ring, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────
export default function CheckerForm() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<PlayerData | null>(null)
  const [blacklist, setBlacklist] = useState<{ users: BlacklistEntry[]; groups: BlacklistEntry[] }>({ users: [], groups: [] })
  const [showAllFriends, setShowAllFriends] = useState(false)
  const [showAllGroups, setShowAllGroups] = useState(false)
  const [exportingChart, setExportingChart] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  const runCheck = useCallback(async () => {
    if (!username.trim()) return
    setError(''); setLoading(true); setData(null); setShowAllFriends(false); setShowAllGroups(false)
    try {
      const [pRes, bRes] = await Promise.all([
        fetch(`/api/lookup?username=${encodeURIComponent(username.trim())}`),
        fetch('/api/database'),
      ])
      const pJson = await pRes.json()
      if (!pRes.ok) throw new Error(pJson.error || 'Lookup failed')
      setData(pJson)
      setBlacklist(bRes.ok ? await bRes.json() : { users: [], groups: [] })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally { setLoading(false) }
  }, [username])

  const flaggedFriends = data ? data.friends.filter(f => blacklist.users.find(u => u.value === String(f.id))) : []
  const flaggedGroups = data ? data.groups.filter(g => blacklist.groups.find(b => b.value === String(g.group.id))) : []

  const riskScore = (flaggedFriends.length > 0 ? 2 : 0) + (flaggedGroups.length > 0 ? 3 : 0) + (data?.profile?.isBanned ? 1 : 0)
  const risk = riskScore >= 4 ? 'HIGH RISK' : riskScore >= 1 ? 'CAUTION' : 'CLEAR'
  const riskColor: 'red' | 'amber' | 'green' = riskScore >= 4 ? 'red' : riskScore >= 1 ? 'amber' : 'green'

  const targetGroup = data?.groups.find(g => g.group.id === TARGET_GROUP)
  const divisionGroups = data?.groups.filter(g => DIVISION_GROUPS.includes(g.group.id)) || []
  const createdDate = data?.profile?.created ? new Date(data.profile.created) : null
  const accountAge = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365)) : null
  const badgeChartData = data ? Object.entries(data.badges.byYear).sort(([a], [b]) => Number(a) - Number(b)).map(([year, badges]) => ({ year, badges })) : []
  const friendsToShow = showAllFriends ? data?.friends || [] : (data?.friends || []).slice(0, 40)
  const groupsToShow = showAllGroups ? data?.groups || [] : (data?.groups || []).slice(0, 25)

  const exportChart = async () => {
    if (!chartRef.current) return
    setExportingChart(true)
    try {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#141417', scale: 2, useCORS: true })
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `${data?.user.name}-badges.png`
      a.click()
    } catch { alert('Export failed') } finally { setExportingChart(false) }
  }

  return (
    <div>
      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 32, position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-3)', fontSize: 16, pointerEvents: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <input
            style={{ width: '100%', padding: '14px 16px 14px 44px', fontSize: 15, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-2)' }}
            placeholder="Enter Roblox username..."
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runCheck()}
            disabled={loading}
          />
        </div>
        <button
          onClick={runCheck}
          disabled={loading || !username.trim()}
          style={{ padding: '14px 28px', fontSize: 14, fontWeight: 600, background: loading ? 'var(--bg-3)' : 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: '#fff', border: 'none', borderRadius: 10, cursor: loading || !username.trim() ? 'not-allowed' : 'pointer', opacity: !username.trim() ? 0.5 : 1, transition: 'all 0.15s', fontFamily: 'Space Grotesk, sans-serif', whiteSpace: 'nowrap' }}
        >
          {loading ? 'Checking…' : 'Run Check'}
        </button>
        {data && (
          <button onClick={() => { setData(null); setError(''); setUsername('') }} style={{ padding: '14px 16px', fontSize: 13, color: 'var(--fg-3)', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>
            Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: 24, padding: '14px 18px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 10, color: 'var(--red)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[120, 80, 100, 60].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 20, width: `${w}%`, maxWidth: '100%' }} />
          ))}
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--fg-3)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
            Fetching player data…
          </div>
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Alert banners */}
          {flaggedFriends.map(f => {
            const bl = blacklist.users.find(u => u.value === String(f.id))
            return (
              <div key={f.id} style={{ padding: '12px 16px', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: 10, fontSize: 13, color: 'var(--amber)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span><strong>Flagged friend:</strong> {f.name}{bl?.reason ? ` — ${bl.reason}` : ''} <a href={`https://www.roblox.com/users/${f.id}/profile`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', opacity: 0.8 }}>↗</a></span>
              </div>
            )
          })}
          {flaggedGroups.map(g => {
            const bl = blacklist.groups.find(b => b.value === String(g.group.id))
            return (
              <div key={g.group.id} style={{ padding: '12px 16px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 10, fontSize: 13, color: 'var(--red)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>🚨</span>
                <span><strong>Flagged group:</strong> {g.group.name}{bl?.reason ? ` — ${bl.reason}` : ''} <a href={`https://www.roblox.com/groups/${g.group.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', opacity: 0.8 }}>↗</a></span>
              </div>
            )
          })}

          {/* Profile Hero Card */}
          <Card>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <AvatarImg src={data.profileAvatarUrl} name={data.user.name} size={80} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: '50%', background: riskScore >= 4 ? 'var(--red)' : riskScore >= 1 ? 'var(--amber)' : 'var(--green)', border: '2px solid var(--bg-2)', boxShadow: `0 0 8px ${riskScore >= 4 ? 'var(--red)' : riskScore >= 1 ? 'var(--amber)' : 'var(--green)'}` }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg)' }}>{data.profile?.displayName || data.user.name}</span>
                  <Chip color={riskColor}>{risk}</Chip>
                  {data.profile?.isBanned && <Chip color="red">BANNED</Chip>}
                  {data.profile?.hasVerifiedBadge && <Chip color="blue">✓ VERIFIED</Chip>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
                  @{data.user.name} · ID {data.user.id}
                </div>
                <a href={`https://www.roblox.com/users/${data.user.id}/profile`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent-2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  View on Roblox ↗
                </a>
              </div>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                {[
                  { label: 'Friends', val: data.friends.length },
                  { label: 'Groups', val: data.groups.length },
                  { label: 'Badges', val: data.badges.total },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--bg-3)', borderRadius: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em' }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bio + meta */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <DataRow label="Joined">
                {createdDate ? createdDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                {accountAge !== null && <Chip>{accountAge}y old</Chip>}
              </DataRow>
              <DataRow label="Bio">
                {data.profile?.description
                  ? <span style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6 }}>{data.profile.description}</span>
                  : <span style={{ color: 'var(--fg-3)', fontStyle: 'italic', fontSize: 13 }}>No bio</span>}
              </DataRow>
            </div>
          </Card>

          {/* Two-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Target Group */}
            <Card>
              <SectionLabel>Target Group</SectionLabel>
              {targetGroup ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <a href={`https://www.roblox.com/groups/${TARGET_GROUP}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: 'var(--fg)', fontWeight: 600, textDecoration: 'none' }}>{targetGroup.group.name}</a>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Chip color="indigo">{targetGroup.role.name}</Chip>
                    <Chip>rank {targetGroup.role.rank}</Chip>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 8 }}>
                  <span style={{ fontSize: 28 }}>–</span>
                  <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Not a member</span>
                </div>
              )}
            </Card>

            {/* Inventory */}
            <Card>
              <SectionLabel>Inventory</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Accessories', val: data.accessories, icon: '🎩' },
                  { label: 'Collectibles', val: data.collectibles, icon: '💎' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 22 }}>{item.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em' }}>{item.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'JetBrains Mono, monospace' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Division Groups */}
          {divisionGroups.length > 0 && (
            <Card>
              <SectionLabel>Division Groups ({divisionGroups.length})</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {divisionGroups.map(g => (
                  <div key={g.group.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <Chip color="indigo">Division</Chip>
                    <a href={`https://www.roblox.com/groups/${g.group.id}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 14, color: 'var(--fg)', textDecoration: 'none', fontWeight: 500 }}>{g.group.name}</a>
                    <Chip>{g.role.name}</Chip>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--fg-3)' }}>{g.group.id}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Friends */}
          <Card>
            <SectionLabel>Friends ({data.friends.length})</SectionLabel>
            {data.friends.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--fg-3)', fontStyle: 'italic' }}>No friends or profile is private.</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {friendsToShow.map(f => {
                    const flagged = !!flaggedFriends.find(ff => ff.id === f.id)
                    return (
                      <a key={f.id} href={`https://www.roblox.com/users/${f.id}/profile`} target="_blank" rel="noopener noreferrer" title={f.name} style={{ position: 'relative', display: 'block', textDecoration: 'none' }}
                        className="group">
                        <AvatarImg src={f.thumbnailUrl} name={f.name} size={44} flagged={flagged} />
                        {flagged && <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: 'var(--red)', border: '2px solid var(--bg-2)', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</div>}
                      </a>
                    )
                  })}
                </div>
                {data.friends.length > 40 && !showAllFriends && (
                  <button onClick={() => setShowAllFriends(true)} style={{ marginTop: 12, fontSize: 12, color: 'var(--accent-2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>
                    + {data.friends.length - 40} more friends
                  </button>
                )}
              </>
            )}
          </Card>

          {/* Groups */}
          <Card>
            <SectionLabel>Groups ({data.groups.length})</SectionLabel>
            {data.groups.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--fg-3)', fontStyle: 'italic' }}>No groups.</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {groupsToShow.map(g => {
                    const flagged = !!flaggedGroups.find(fg => fg.group.id === g.group.id)
                    const isDivision = DIVISION_GROUPS.includes(g.group.id)
                    return (
                      <div key={g.group.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', background: flagged ? 'rgba(244,63,94,0.03)' : 'transparent' }}>
                        {flagged && <span style={{ fontSize: 14 }}>🚨</span>}
                        {isDivision && <Chip color="indigo">DIV</Chip>}
                        <a href={`https://www.roblox.com/groups/${g.group.id}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 13, color: flagged ? 'var(--red)' : 'var(--fg)', textDecoration: 'none', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.group.name}</a>
                        <Chip color={flagged ? 'red' : 'default'}>{g.role.name}</Chip>
                        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--fg-3)', flexShrink: 0 }}>{g.group.id}</span>
                      </div>
                    )
                  })}
                </div>
                {data.groups.length > 25 && !showAllGroups && (
                  <button onClick={() => setShowAllGroups(true)} style={{ marginTop: 12, fontSize: 12, color: 'var(--accent-2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>
                    + {data.groups.length - 25} more groups
                  </button>
                )}
              </>
            )}
          </Card>

          {/* Badge Chart */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, letterSpacing: '0.1em', color: 'var(--fg-3)', textTransform: 'uppercase' }}>Badges</span>
                <div style={{ height: 1, width: 40, background: 'var(--border)' }} />
                <Chip color="indigo">{data.badges.total} total</Chip>
              </div>
              <button
                onClick={exportChart}
                disabled={exportingChart || badgeChartData.length === 0}
                style={{ fontSize: 12, color: 'var(--fg-3)', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.15s' }}
              >
                {exportingChart ? 'Exporting…' : '↓ Export PNG'}
              </button>
            </div>
            {badgeChartData.length > 0 ? (
              <div ref={chartRef} style={{ background: 'var(--bg-2)', padding: '16px 8px 8px', borderRadius: 8 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={badgeChartData} barCategoryGap="30%">
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--fg-3)', fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--fg-3)', fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} width={35} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--fg)' }}
                      cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                      labelStyle={{ color: 'var(--fg-2)' }}
                    />
                    <Bar dataKey="badges" radius={[4, 4, 0, 0]}>
                      {badgeChartData.map((_, i) => (
                        <Cell key={i} fill={i === badgeChartData.length - 1 ? 'var(--accent-2)' : 'var(--bg-4)'} stroke="var(--border)" strokeWidth={1} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-3)', fontSize: 13 }}>No badge data found</div>
            )}
          </Card>

          {/* Conclusion */}
          <Card style={{ borderColor: riskScore >= 4 ? 'var(--red-border)' : riskScore >= 1 ? 'var(--amber-border)' : 'var(--green-border)' }}>
            <SectionLabel>Conclusion</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 16px', background: riskScore >= 4 ? 'var(--red-bg)' : riskScore >= 1 ? 'var(--amber-bg)' : 'var(--green-bg)', borderRadius: 8 }}>
              <span style={{ fontSize: 28 }}>{riskScore >= 4 ? '🚨' : riskScore >= 1 ? '⚠️' : '✅'}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: riskScore >= 4 ? 'var(--red)' : riskScore >= 1 ? 'var(--amber)' : 'var(--green)' }}>{risk}</div>
                <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 2 }}>
                  {riskScore >= 4 ? 'Exercise extreme caution. Multiple flagged associations detected.'
                    : riskScore >= 1 ? 'Review flagged associations before proceeding.'
                    : 'No red flags detected against current blacklist.'}
                </div>
              </div>
            </div>
            <pre style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--fg-2)', lineHeight: 1.8, whiteSpace: 'pre-wrap', background: 'var(--bg-3)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
{`Player : ${data.profile?.displayName || data.user.name} (@${data.user.name})
ID     : ${data.user.id}
Age    : ${accountAge !== null ? accountAge + ' year(s)' : 'unknown'} · Status: ${data.profile?.isBanned ? 'BANNED' : 'Active'}
Groups : ${data.groups.length}  Friends: ${data.friends.length}  Badges: ${data.badges.total}

Target Group ${TARGET_GROUP}: ${targetGroup ? `✓ Member — ${targetGroup.role.name} (rank ${targetGroup.role.rank})` : '✗ Not a member'}
Division Groups: ${divisionGroups.length > 0 ? divisionGroups.map(g => g.group.name).join(', ') : 'None'}

Flagged Friends: ${flaggedFriends.length > 0 ? flaggedFriends.map(f => f.name).join(', ') : 'None'}
Flagged Groups : ${flaggedGroups.length > 0 ? flaggedGroups.map(g => g.group.name).join(', ') : 'None'}`}
            </pre>
          </Card>
        </div>
      )}
    </div>
  )
}
