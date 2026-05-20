export type Severity = 'high' | 'medium' | 'low'
export interface BlacklistUser { username: string; severity: Severity; reason: string; addedAt: string }
export interface BlacklistGroup { id: string; name?: string; severity: Severity; reason: string; addedAt: string }
export interface Blacklist { users: BlacklistUser[]; groups: BlacklistGroup[] }

const fallback: Blacklist = { users: [], groups: [] }

export async function loadBlacklist(): Promise<Blacklist> {
  try {
    const url = process.env.NEXT_PUBLIC_BLACKLIST_SHEET_URL
    if (!url) return fallback
    const res = await fetch(url, { cache: 'no-store' })
    const text = await res.text()
    const rows = text.split('\n').slice(1)
    const users: BlacklistUser[] = []
    const groups: BlacklistGroup[] = []

    rows.forEach((row) => {
      const [type,idOrUsername,reason='',severity='medium'] = row.split(',').map(v=>v?.trim())
      if (type === 'user') users.push({ username: idOrUsername.toLowerCase(), reason, severity: severity as Severity, addedAt: new Date().toISOString() })
      if (type === 'group') groups.push({ id: idOrUsername, reason, severity: severity as Severity, addedAt: new Date().toISOString() })
    })

    return { users, groups }
  } catch {
    return fallback
  }
}
