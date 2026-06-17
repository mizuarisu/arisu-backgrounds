'use client'
import { useState, useEffect, useCallback } from 'react'

type LogLevel = 'info' | 'warn' | 'error'
type LogAction = 'player_lookup' | 'badge_fetch' | 'username_resolve' | 'blacklist_add' | 'blacklist_remove' | 'blacklist_fetch' | 'system'

interface LogItem {
  id: string
  level: LogLevel
  action: LogAction
  message: string
  meta?: Record<string, unknown>
  timestamp: string
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

const levelColor: Record<LogLevel, 'red' | 'amber' | 'blue'> = { error: 'red', warn: 'amber', info: 'blue' }
const levelIcon: Record<LogLevel, string> = { error: '✕', warn: '!', info: 'i' }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function LogsViewer() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<LogLevel | 'all'>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [clearing, setClearing] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      setError('')
      const res = await fetch('/api/logs?limit=200')
      if (!res.ok) throw new Error('Failed to fetch logs')
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchLogs])

  const handleClear = async () => {
    if (!confirm('Clear all logs? This cannot be undone.')) return
    setClearing(true)
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to clear logs')
      setLogs([])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to clear logs')
    } finally {
      setClearing(false)
    }
  }

  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter)
  const errorCount = logs.filter(l => l.level === 'error').length
  const warnCount = logs.filter(l => l.level === 'warn').length
  const infoCount = logs.filter(l => l.level === 'info').length

  const filterBtn = (label: string, value: LogLevel | 'all', count: number, color: 'default' | 'red' | 'amber' | 'blue') => (
    <button
      onClick={() => setFilter(value)}
      style={{
        padding: '8px 14px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 500,
        borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        border: `1px solid ${filter === value ? 'var(--accent)' : 'var(--border)'}`,
        background: filter === value ? 'var(--accent-glow)' : 'var(--bg-3)',
        color: filter === value ? 'var(--accent-2)' : 'var(--fg-2)',
      }}
    >
      {label} <Chip color={color}>{count}</Chip>
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 10, color: 'var(--red)', fontSize: 13 }}>{error}</div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {filterBtn('All', 'all', logs.length, 'default')}
          {filterBtn('Info', 'info', infoCount, 'blue')}
          {filterBtn('Warn', 'warn', warnCount, 'amber')}
          {filterBtn('Error', 'error', errorCount, 'red')}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            Auto-refresh
          </label>
          <button onClick={fetchLogs} style={{ padding: '8px 14px', fontSize: 12, background: 'var(--bg-3)', color: 'var(--fg-2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>
            ↻ Refresh
          </button>
          <button onClick={handleClear} disabled={clearing || logs.length === 0} style={{ padding: '8px 14px', fontSize: 12, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', borderRadius: 8, cursor: logs.length === 0 ? 'not-allowed' : 'pointer', opacity: logs.length === 0 ? 0.5 : 1, fontFamily: 'Space Grotesk, sans-serif' }}>
            {clearing ? 'Clearing…' : 'Clear all'}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--fg-3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14 }}>No logs yet. Activity will appear here as the tool is used.</div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map((log, i) => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                background: levelColor[log.level] === 'red' ? 'var(--red-bg)' : levelColor[log.level] === 'amber' ? 'var(--amber-bg)' : 'var(--blue-bg)',
                color: levelColor[log.level] === 'red' ? 'var(--red)' : levelColor[log.level] === 'amber' ? 'var(--amber)' : 'var(--blue)',
                border: `1px solid ${levelColor[log.level] === 'red' ? 'var(--red-border)' : levelColor[log.level] === 'amber' ? 'var(--amber-border)' : 'var(--blue-border)'}`,
              }}>
                {levelIcon[log.level]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <Chip color="indigo">{log.action.replace(/_/g, ' ')}</Chip>
                  <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'JetBrains Mono, monospace' }}>{timeAgo(log.timestamp)}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.5 }}>{log.message}</div>
                {log.meta && Object.keys(log.meta).length > 0 && (
                  <details style={{ marginTop: 6 }}>
                    <summary style={{ fontSize: 11, color: 'var(--fg-3)', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>metadata</summary>
                    <pre style={{ fontSize: 11, color: 'var(--fg-2)', fontFamily: 'JetBrains Mono, monospace', marginTop: 6, background: 'var(--bg-3)', padding: 10, borderRadius: 6, overflow: 'auto' }}>
                      {JSON.stringify(log.meta, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
              <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
