'use client'
import { useState, useCallback } from 'react'
import BadgeChart from './BadgeChart'

const TARGET_GROUP = 4219097
const DIVISION_GROUPS = [812204725, 503346911, 34510781, 8310499, 5336916, 5351323, 5351327, 5336904, 33036871, 5336914]

interface PlayerData {
  user: { id: number; name: string; displayName: string }
  profile: { description: string; created: string; isBanned: boolean; hasVerifiedBadge: boolean; displayName: string }
  profileAvatarUrl: string | null
  friends: Array<{ id: number; name: string; displayName: string; thumbnailUrl: string | null }>
  groups: Array<{ group: { id: number; name: string; memberCount: number }; role: { name: string; rank: number } }>
  badgeCount: number
  badgeDates: string[]
  accessories: number
  ownedAccessoryCount: number | null
  collectibles: number
  directBlacklistEntry: { reason: string; severity: 'high' | 'medium' | 'low'; addedAt: string } | null
  xtrackerFound: boolean | null
  xtrackerEvidence: Array<{ reason?: string; date?: string; url?: string }>
  xtrackerAltCount: number
}

interface BlacklistEntry {
  id: string; type: 'user' | 'group'; value: string; name?: string
  severity: 'high' | 'medium' | 'low'; reason: string
}

// ── Atoms ────────────────────────────────────────────────────
function Chip({ children, color = 'default' }: { children: React.ReactNode; color?: 'default' | 'green' | 'red' | 'amber' | 'blue' | 'indigo' }) {
  const map = {
    default: { bg: 'var(--bg-3)', color: 'var(--fg-2)', border: 'var(--border)' },
    green:   { bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green-border)' },
    red:     { bg: 'var(--red-bg)', color: 'var(--red)', border: 'var(--red-border)' },
    amber:   { bg: 'var(--amber-bg)', color: 'var(--amber)', border: 'var(--amber-border)' },
    blue:    { bg: 'var(--blue-bg)', color: 'var(--blue)', border: 'var(--blue-border)' },
    indigo:  { bg: 'var(--blush)', color: 'var(--accent-2)', border: 'var(--border)' },
  }
  const s = map[color]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 99, padding: '3px 10px', fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function Card({ children, style, hover = true }: { children: React.ReactNode; style?: React.CSSProperties; hover?: boolean }) {
  return (
    <div className={hover ? 'card-hover' : ''} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-sm)', ...style }}>
      {children}
    </div>
  )
}

function SectionLabel({ children, emoji }: { children: React.ReactNode; emoji?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      {emoji && <span style={{ fontSize: 14 }}>{emoji}</span>}
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)', fontFamily: 'Quicksand, sans-serif' }}>{children}</span>
      <div className="dotted-divider" style={{ flex: 1 }} />
    </div>
  )
}

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '11px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start', fontSize: 14 }}>
      <span style={{ width: 140, flexShrink: 0, color: 'var(--fg-3)', fontSize: 13, fontWeight: 500 }}>{label}</span>
      <span style={{ flex: 1, color: 'var(--fg)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>{children}</span>
    </div>
  )
}

function AvatarImg({ src, name, size = 40, flagged = false }: { src: string | null; name: string; size?: number; flagged?: boolean }) {
  const [err, setErr] = useState(false)
  const initials = name[0]?.toUpperCase() || '?'
  const ring = flagged ? `0 0 0 3px var(--red)` : 'var(--shadow-sm)'
  if (src && !err) {
    return <img src={src} alt={name} width={size} height={size} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', boxShadow: ring, border: '2px solid var(--bg-2)' }} onError={() => setErr(true)} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, var(--pink-soft), var(--lavender-light))', border: '2px solid var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size > 40 ? 20 : 13, color: '#fff', fontWeight: 700, boxShadow: ring, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

// Animated count-up number for the stat tiles
function CountUp({ value, emoji, label, locked }: { value: number; emoji: string; label: string; locked?: boolean }) {
  return (
    <div className="count-pop" style={{ textAlign: 'center', padding: '10px 16px', background: 'var(--bg-2)', borderRadius: 14, boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ fontSize: 13 }}>{locked ? '🔒' : emoji}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: locked ? 'var(--fg-3)' : 'var(--fg)', letterSpacing: '-0.02em' }}>{locked ? '—' : value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--fg-3)', fontWeight: 600 }}>{label}</div>
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

  const riskScore = (flaggedFriends.length > 0 ? 2 : 0) + (flaggedGroups.length > 0 ? 3 : 0) + (data?.profile?.isBanned ? 1 : 0) + (data?.directBlacklistEntry ? 5 : 0) + (data?.xtrackerFound ? 3 : 0)
  const risk = riskScore >= 4 ? 'HIGH RISK' : riskScore >= 1 ? 'CAUTION' : 'CLEAR'
  const riskColor: 'red' | 'amber' | 'green' = riskScore >= 4 ? 'red' : riskScore >= 1 ? 'amber' : 'green'

  const targetGroup = data?.groups.find(g => g.group.id === TARGET_GROUP)
  const divisionGroups = data?.groups.filter(g => DIVISION_GROUPS.includes(g.group.id)) || []
  const createdDate = data?.profile?.created ? new Date(data.profile.created) : null
  const accountAge = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365)) : null
  const friendsToShow = showAllFriends ? data?.friends || [] : (data?.friends || []).slice(0, 40)
  const groupsToShow = showAllGroups ? data?.groups || [] : (data?.groups || []).slice(0, 25)

  return (
    <div>
      {/* Search Bar */}
      <Card hover={false} style={{ marginBottom: 28, padding: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-3)', pointerEvents: 'none' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <input
              style={{ width: '100%', padding: '14px 16px 14px 46px', fontSize: 15, borderRadius: 14 }}
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
            style={{ padding: '14px 30px', fontSize: 14.5, fontWeight: 700, background: loading ? 'var(--lavender-light)' : 'linear-gradient(135deg, var(--red), var(--lavender-deep))', color: '#fff', border: 'none', borderRadius: 14, cursor: loading || !username.trim() ? 'not-allowed' : 'pointer', opacity: !username.trim() ? 0.5 : 1, transition: 'all 0.2s', fontFamily: 'Quicksand, sans-serif', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {loading ? <><span className="spin-slow" style={{ display: 'inline-block' }}>✨</span> Checking…</> : <>🔍 Run Check</>}
          </button>
          {data && (
            <button onClick={() => { setData(null); setError(''); setUsername('') }} style={{ padding: '14px 18px', fontSize: 13, color: 'var(--fg-3)', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 14, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
              Clear
            </button>
          )}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="animate-pop" style={{ marginBottom: 24, padding: '14px 18px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 16, color: 'var(--red)', fontSize: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 18 }}>{error.toLowerCase().includes('rate limited') ? '⏳' : '😕'}</span>
          <div>
            <div>{error}</div>
            {error.toLowerCase().includes('rate limited') && (
              <div style={{ fontSize: 12.5, color: 'var(--fg-2)', marginTop: 4 }}>This is Roblox throttling requests, not a bug — wait a few seconds and try again.</div>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="skeleton" style={{ height: 120 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="skeleton" style={{ height: 100 }} />
            <div className="skeleton" style={{ height: 100 }} />
          </div>
          <div className="skeleton" style={{ height: 80 }} />
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--fg-3)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span className="sparkle-anim">🔮</span> Fetching player data…
          </div>
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Alert banners */}

          {/* Direct blacklist hit — the SEARCHED PLAYER THEMSELF is on the blacklist.
              This is the loudest banner since it's a direct match, not an association. */}
          {data.directBlacklistEntry && (
            <div className="animate-pop" style={{ padding: '16px 20px', background: 'var(--red-bg)', border: '2px solid var(--red)', borderRadius: 16, fontSize: 14.5, color: 'var(--red)', display: 'flex', gap: 12, alignItems: 'flex-start', boxShadow: '0 0 0 4px var(--red-bg)' }}>
              <span style={{ fontSize: 22 }}>🚨</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>This player is on your blacklist</div>
                <div style={{ fontSize: 13.5 }}>
                  {data.directBlacklistEntry.reason || 'No reason recorded.'}
                  {' '}<Chip color={data.directBlacklistEntry.severity === 'high' ? 'red' : data.directBlacklistEntry.severity === 'medium' ? 'amber' : 'default'}>{data.directBlacklistEntry.severity} severity</Chip>
                </div>
              </div>
            </div>
          )}

          {flaggedFriends.map(f => {
            const bl = blacklist.users.find(u => u.value === String(f.id))
            return (
              <div key={f.id} className="animate-pop" style={{ padding: '13px 18px', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: 16, fontSize: 13.5, color: '#9c6a26', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 17 }}>⚠️</span>
                <span><strong>Flagged friend:</strong> {f.name}{bl?.reason ? ` — ${bl.reason}` : ''} <a href={`https://www.roblox.com/users/${f.id}/profile`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>view ↗</a></span>
              </div>
            )
          })}
          {flaggedGroups.map(g => {
            const bl = blacklist.groups.find(b => b.value === String(g.group.id))
            return (
              <div key={g.group.id} className="animate-pop" style={{ padding: '13px 18px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 16, fontSize: 13.5, color: '#b8455f', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 17 }}>🚨</span>
                <span><strong>Flagged group:</strong> {g.group.name}{bl?.reason ? ` — ${bl.reason}` : ''} <a href={`https://www.roblox.com/groups/${g.group.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>view ↗</a></span>
              </div>
            )
          })}

          {/* Profile Hero Card */}
          <Card style={{ background: 'linear-gradient(135deg, var(--bg-2), var(--bg-3))', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, var(--pink-soft), transparent 70%)', opacity: 0.6 }} />
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <AvatarImg src={data.profileAvatarUrl} name={data.user.name} size={84} />
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', background: riskScore >= 4 ? 'var(--red)' : riskScore >= 1 ? 'var(--amber)' : 'var(--green)', border: '3px solid var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>
                  {riskScore >= 4 ? '!' : riskScore >= 1 ? '?' : '✓'}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg)', fontFamily: 'Quicksand, sans-serif' }}>{data.profile?.displayName || data.user.name}</span>
                  <Chip color={riskColor}>{risk}</Chip>
                  {data.profile?.isBanned && <Chip color="red">BANNED</Chip>}
                  {data.profile?.hasVerifiedBadge && <Chip color="blue">✓ Verified</Chip>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg-3)', marginBottom: 8 }}>
                  @{data.user.name} · ID {data.user.id}
                </div>
                <a href={`https://www.roblox.com/users/${data.user.id}/profile`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: 'var(--accent-2)', textDecoration: 'none', fontWeight: 600 }}>
                  View on Roblox ↗
                </a>
              </div>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <CountUp value={data.friends.length} emoji="👥" label="Friends" />
                <CountUp value={data.groups.length} emoji="🏷️" label="Groups" />
                <CountUp value={data.badgeCount} emoji="🏆" label="Badges" />
              </div>
            </div>

            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
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

          {/* Three-col grid: Target group / Inventory / Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
            <Card>
              <SectionLabel emoji="🎯">Target Group</SectionLabel>
              {targetGroup ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a href={`https://www.roblox.com/groups/${TARGET_GROUP}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: 'var(--fg)', fontWeight: 700, textDecoration: 'none' }}>{targetGroup.group.name}</a>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Chip color="indigo">{targetGroup.role.name}</Chip>
                    <Chip>rank {targetGroup.role.rank}</Chip>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: 6 }}>
                  <span style={{ fontSize: 26 }}>🤷</span>
                  <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Not a member</span>
                </div>
              )}
            </Card>

            <Card>
              <SectionLabel emoji="🎒">Inventory</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'var(--bg-3)', borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ fontSize: 22 }}>🎩</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em' }}>{data.accessories}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 600 }}>Equipped</div>
                </div>
                <div style={{ background: 'var(--bg-3)', borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ fontSize: 22 }}>💎</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em' }}>{data.collectibles}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 600 }}>Collectibles</div>
                </div>
              </div>
              {data.ownedAccessoryCount !== null && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--fg-2)', textAlign: 'center' }}>
                  <strong style={{ color: 'var(--fg)' }}>{data.ownedAccessoryCount}</strong> total accessories owned
                </div>
              )}
            </Card>

            {/* Badge count tile — full chart (if dates are available) renders below as its own card */}
            <Card style={{ background: 'linear-gradient(135deg, var(--blush), var(--bg-2))' }}>
              <SectionLabel emoji="🏆">Total Badges</SectionLabel>
              <div className="count-pop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 4 }}>
                <div style={{ fontSize: 38, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.03em', fontFamily: 'Quicksand, sans-serif' }}>
                  {data.badgeCount}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 600 }}>
                  {data.badgeCount >= 500 ? '500+ (capped)' : data.badgeCount === 0 ? 'check Logs if unexpected' : 'badges earned'}
                </div>
              </div>
            </Card>
          </div>

          {/* xTracker result — third-party community anti-cheat database, NOT
              our own data. Shown as its own card right below Target Group, with
              both a "found" and a "clear" state so the absence of a hit is
              visible too, not just silence. Confirmed real shape: each
              evidence entry has reason/date/url; date is already a
              human-readable string from the API, displayed as-is rather than
              re-parsed. */}
          {data.xtrackerFound !== null && (
            <Card style={{ border: data.xtrackerFound ? '1.5px solid var(--amber-border)' : '1px solid var(--border)', background: data.xtrackerFound ? 'var(--amber-bg)' : 'var(--bg-2)' }}>
              <SectionLabel emoji="🔎">xTracker</SectionLabel>
              {data.xtrackerFound ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 22 }}>⚠️</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: '#9c6a26', marginBottom: 2 }}>Found in xTracker — verify before acting</div>
                      {data.xtrackerAltCount > 0 && (
                        <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>{data.xtrackerAltCount} linked alt account{data.xtrackerAltCount > 1 ? 's' : ''} on file.</div>
                      )}
                      {data.xtrackerEvidence.length === 0 && (
                        <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>xTracker is a community-run anti-cheat database; this app doesn&apos;t have access to the specific reason. Contact xTracker staff for details before taking action.</div>
                      )}
                    </div>
                  </div>
                  {data.xtrackerEvidence.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 34 }}>
                      {data.xtrackerEvidence.map((entry, i) => (
                        <div key={i} style={{ fontSize: 13, color: 'var(--fg-2)', background: 'var(--bg-2)', borderRadius: 10, padding: '8px 12px' }}>
                          {entry.reason && <div><strong style={{ color: 'var(--fg)' }}>Reason:</strong> {entry.reason}</div>}
                          {entry.date && <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{entry.date}</div>}
                          {entry.url && (
                            <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent-2)', textDecoration: 'underline', display: 'inline-block', marginTop: 4 }}>
                              View evidence ↗
                            </a>
                          )}
                        </div>
                      ))}
                      <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>Still verify with xTracker staff before acting — this app can&apos;t confirm appeal status.</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 22 }}>✅</span>
                  <div style={{ fontSize: 13.5, color: 'var(--fg-2)' }}>Clear — not found in xTracker&apos;s database.</div>
                </div>
              )}
            </Card>
          )}

          {/* Badges-over-time chart — only renders when we have award-date data,
              which requires the Open Cloud source (ROBLOX_OPEN_CLOUD_KEY set).
              The legacy fallback has no timestamps, so this silently doesn't
              show rather than rendering an empty/broken chart. */}
          {data.badgeDates && data.badgeDates.length > 1 && (
            <Card>
              <SectionLabel emoji="📈">Badges Over Time</SectionLabel>
              <BadgeChart dates={data.badgeDates} />
              <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 8, textAlign: 'right' }}>
                Cumulative badge count by award date · {data.badgeDates.length} badges plotted
              </div>
            </Card>
          )}

          {/* Division Groups */}
          {divisionGroups.length > 0 && (
            <Card>
              <SectionLabel emoji="🏛️">Division Groups ({divisionGroups.length})</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {divisionGroups.map(g => (
                  <div key={g.group.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                    <Chip color="indigo">Division</Chip>
                    <a href={`https://www.roblox.com/groups/${g.group.id}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 14, color: 'var(--fg)', textDecoration: 'none', fontWeight: 600 }}>{g.group.name}</a>
                    <Chip>{g.role.name}</Chip>
                    <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{g.group.id}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Friends */}
          <Card>
            <SectionLabel emoji="👥">Friends ({data.friends.length})</SectionLabel>
            {data.friends.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--fg-3)', fontStyle: 'italic' }}>No friends or profile is private.</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {friendsToShow.map(f => {
                    const flagged = !!flaggedFriends.find(ff => ff.id === f.id)
                    return (
                      <a key={f.id} href={`https://www.roblox.com/users/${f.id}/profile`} target="_blank" rel="noopener noreferrer" title={f.name} style={{ position: 'relative', display: 'block', textDecoration: 'none', transition: 'transform 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                        <AvatarImg src={f.thumbnailUrl} name={f.name} size={46} flagged={flagged} />
                        {flagged && <div style={{ position: 'absolute', top: -4, right: -4, width: 15, height: 15, borderRadius: '50%', background: 'var(--red)', border: '2px solid var(--bg-2)', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>!</div>}
                      </a>
                    )
                  })}
                </div>
                {data.friends.length > 40 && !showAllFriends && (
                  <button onClick={() => setShowAllFriends(true)} style={{ marginTop: 14, fontSize: 12.5, color: 'var(--accent-2)', background: 'var(--blush)', border: 'none', borderRadius: 99, padding: '6px 14px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                    + {data.friends.length - 40} more friends
                  </button>
                )}
              </>
            )}
          </Card>

          {/* Groups */}
          <Card>
            <SectionLabel emoji="🏷️">Groups ({data.groups.length})</SectionLabel>
            {data.groups.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--fg-3)', fontStyle: 'italic' }}>No groups.</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {groupsToShow.map(g => {
                    const flagged = !!flaggedGroups.find(fg => fg.group.id === g.group.id)
                    const isDivision = DIVISION_GROUPS.includes(g.group.id)
                    return (
                      <div key={g.group.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', margin: '0 -12px', borderRadius: 12, background: flagged ? 'var(--red-bg)' : 'transparent' }}>
                        {flagged && <span style={{ fontSize: 14 }}>🚨</span>}
                        {isDivision && <Chip color="indigo">DIV</Chip>}
                        <a href={`https://www.roblox.com/groups/${g.group.id}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 13, color: flagged ? 'var(--red)' : 'var(--fg)', textDecoration: 'none', fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.group.name}</a>
                        <Chip color={flagged ? 'red' : 'default'}>{g.role.name}</Chip>
                        <span style={{ fontSize: 11, color: 'var(--fg-3)', flexShrink: 0 }}>{g.group.id}</span>
                      </div>
                    )
                  })}
                </div>
                {data.groups.length > 25 && !showAllGroups && (
                  <button onClick={() => setShowAllGroups(true)} style={{ marginTop: 14, fontSize: 12.5, color: 'var(--accent-2)', background: 'var(--blush)', border: 'none', borderRadius: 99, padding: '6px 14px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                    + {data.groups.length - 25} more groups
                  </button>
                )}
              </>
            )}
          </Card>

          {/* Conclusion */}
          <Card style={{ border: `1.5px solid ${riskScore >= 4 ? 'var(--red-border)' : riskScore >= 1 ? 'var(--amber-border)' : 'var(--green-border)'}` }}>
            <SectionLabel emoji="📝">Conclusion</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '14px 18px', background: riskScore >= 4 ? 'var(--red-bg)' : riskScore >= 1 ? 'var(--amber-bg)' : 'var(--green-bg)', borderRadius: 16 }}>
              <span style={{ fontSize: 30 }}>{riskScore >= 4 ? '🚨' : riskScore >= 1 ? '⚠️' : '✅'}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: riskScore >= 4 ? 'var(--red)' : riskScore >= 1 ? 'var(--amber)' : 'var(--green)', fontFamily: 'Quicksand, sans-serif' }}>{risk}</div>
                <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 2 }}>
                  {riskScore >= 4 ? 'Exercise extreme caution. Multiple flagged associations detected.'
                    : riskScore >= 1 ? 'Review flagged associations before proceeding.'
                    : 'No red flags detected against current blacklist.'}
                </div>
              </div>
            </div>
            <pre style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--fg-2)', lineHeight: 1.8, whiteSpace: 'pre-wrap', background: 'var(--bg-3)', padding: 16, borderRadius: 14, border: '1px solid var(--border)' }}>
{`Player : ${data.profile?.displayName || data.user.name} (@${data.user.name})
ID     : ${data.user.id}
Age    : ${accountAge !== null ? accountAge + ' year(s)' : 'unknown'} · Status: ${data.profile?.isBanned ? 'BANNED' : 'Active'}
Groups : ${data.groups.length}  Friends: ${data.friends.length}  Badges: ${data.badgeCount}${data.ownedAccessoryCount !== null ? `  Accessories owned: ${data.ownedAccessoryCount}` : ''}

Target Group ${TARGET_GROUP}: ${targetGroup ? `✓ Member — ${targetGroup.role.name} (rank ${targetGroup.role.rank})` : '✗ Not a member'}
Division Groups: ${divisionGroups.length > 0 ? divisionGroups.map(g => g.group.name).join(', ') : 'None'}

Flagged Friends: ${flaggedFriends.length > 0 ? flaggedFriends.map(f => f.name || `User ${f.id}`).join(', ') : 'None'}
Flagged Groups : ${flaggedGroups.length > 0 ? flaggedGroups.map(g => g.group.name || `Group ${g.group.id}`).join(', ') : 'None'}
Blacklisted    : ${data.directBlacklistEntry ? `YES — ${data.directBlacklistEntry.reason || 'no reason recorded'}` : 'No'}
xTracker       : ${data.xtrackerFound === null ? 'Not checked (no API key configured)' : data.xtrackerFound ? `FOUND${data.xtrackerEvidence.length > 0 ? ' — ' + data.xtrackerEvidence.map(e => e.reason || 'reason unknown').join('; ') : ' — verify with xTracker staff'}${data.xtrackerAltCount > 0 ? ` (${data.xtrackerAltCount} alts)` : ''}` : 'Not found'}`}
            </pre>
          </Card>
        </div>
      )}
    </div>
  )
}
