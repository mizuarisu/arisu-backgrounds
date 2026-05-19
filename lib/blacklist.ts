export type Severity = 'high' | 'medium' | 'low'

export interface BlacklistUser {
  username: string
  severity: Severity
  reason: string
  addedAt: string
}

export interface BlacklistGroup {
  id: string
  name?: string
  severity: Severity
  reason: string
  addedAt: string
}

export interface Blacklist {
  users: BlacklistUser[]
  groups: BlacklistGroup[]
}

const KEY = 'roblox_blacklist_v1'

export function loadBlacklist(): Blacklist {
  if (typeof window === 'undefined') return { users: [], groups: [] }
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{"users":[],"groups":[]}')
  } catch {
    return { users: [], groups: [] }
  }
}

export function saveBlacklist(bl: Blacklist) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(bl))
}
