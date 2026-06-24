const BASE = (sub: string) => `https://${sub}.roproxy.com`

export async function getUserByUsername(username: string) {
  // The username→ID resolution endpoint is one of Roblox's most heavily
  // rate-limited (every tool calls it first), so transient 429s here are
  // common even under normal use, not necessarily a sign of abuse. One retry
  // with a short delay clears most of these without the user needing to
  // manually click "Run Check" again.
  const maxAttempts = 2
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${BASE('users')}/v1/usernames/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
        next: { revalidate: 0 },
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        const isRateLimited = res.status === 429
        const reason = isRateLimited ? 'Rate limited by Roblox/roproxy' : `Upstream error (HTTP ${res.status})`
        lastError = new Error(`User lookup failed: ${reason} — ${body.slice(0, 200)}`)

        if (isRateLimited && attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 800 * attempt)) // 800ms, then 1600ms
          continue
        }
        throw lastError
      }

      const data = await res.json()
      if (!data.data?.length) throw new Error('User not found')
      return data.data[0] as { id: number; name: string; displayName: string }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
      if (lastError.message === 'User not found') throw lastError // don't retry a genuine not-found
      if (attempt >= maxAttempts) throw lastError
    }
  }

  throw lastError || new Error('User lookup failed: unknown error')
}

export async function getUserProfile(uid: number) {
  const res = await fetch(`${BASE('users')}/v1/users/${uid}`, { next: { revalidate: 0 } })
  if (!res.ok) {
    const reason = res.status === 429 ? 'Rate limited by Roblox/roproxy' : `Upstream error (HTTP ${res.status})`
    throw new Error(`Profile fetch failed: ${reason}`)
  }
  return res.json()
}

export async function getFriends(uid: number) {
  const res = await fetch(`${BASE('friends')}/v1/users/${uid}/friends`, { next: { revalidate: 0 } })
  if (!res.ok) return []
  const data = await res.json()
  const raw = (data.data || []) as Array<Record<string, unknown>>
  // Defensively normalize: some Roblox friend payloads have used different
  // casing/fields over time (name vs displayName vs username). Guarantee every
  // friend object has a usable, non-empty `name` so UI text never silently
  // renders blank (e.g. in the Conclusion summary).
  return raw.map(f => {
    const id = Number(f.id ?? f.userId ?? 0)
    const name = (f.name as string) || (f.username as string) || (f.displayName as string) || `User ${id}`
    const displayName = (f.displayName as string) || name
    return { id, name, displayName }
  })
}

export async function getGroups(uid: number) {
  const res = await fetch(`${BASE('groups')}/v1/users/${uid}/groups/roles`, { next: { revalidate: 0 } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.data || []) as Array<{
    group: { id: number; name: string; memberCount: number }
    role: { name: string; rank: number }
  }>
}

// Legacy badge count via the public listing endpoint, proxied through roproxy.
// Kept as a fallback for when no Open Cloud API key is configured.
async function getBadgeCountLegacy(uid: number): Promise<{ count: number; debug?: string }> {
  const url = `${BASE('badges')}/v1/users/${uid}/badges?limit=100&sortOrder=Desc`
  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    const rawBody = await res.text()

    if (!res.ok) {
      return { count: 0, debug: `[legacy] [${url}] → HTTP ${res.status}: ${rawBody.slice(0, 300)}` }
    }

    let data: { data?: unknown[]; nextPageCursor?: string | null }
    try {
      data = JSON.parse(rawBody)
    } catch {
      return { count: 0, debug: `[legacy] [${url}] → response was not valid JSON: ${rawBody.slice(0, 300)}` }
    }

    if (!Array.isArray(data.data)) {
      return { count: 0, debug: `[legacy] [${url}] → response JSON had no "data" array: ${rawBody.slice(0, 300)}` }
    }

    if (data.data.length === 0) {
      return { count: 0, debug: `[legacy] [${url}] → 0 badges returned, raw body: ${rawBody.slice(0, 300)}` }
    }

    let total = data.data.length
    let cursor = data.nextPageCursor ?? null
    let pages = 1
    while (cursor && pages < 50) {
      const nextRes = await fetch(`${url}&cursor=${cursor}`, { next: { revalidate: 0 } })
      if (!nextRes.ok) break
      const nextData = await nextRes.json()
      if (!Array.isArray(nextData.data) || nextData.data.length === 0) break
      total += nextData.data.length
      cursor = nextData.nextPageCursor
      pages++
    }
    return { count: total }
  } catch (e) {
    return { count: 0, debug: `[legacy] Fetch threw an exception: ${e instanceof Error ? e.message : String(e)}` }
  }
}

// Badge count via the Roblox Open Cloud Inventory API (apis.roblox.com/cloud/v2).
// Requires an API key with "User Inventory API" read permission, set as
// ROBLOX_OPEN_CLOUD_KEY in env vars. Uses x-api-key header auth — not a cookie —
// so it isn't affected by the legacy badges.roblox.com privacy/auth changes.
// Docs: https://create.roblox.com/docs/cloud/guides/inventory
//
// Each inventoryItem includes an `addTime` field (ISO 8601 timestamp of when
// the badge was awarded), confirmed via a working community script — this lets
// us rebuild a "badges over time" chart, which the legacy endpoint can't do.
async function getBadgeCountOpenCloud(uid: number, apiKey: string): Promise<{ count: number; dates: string[]; debug?: string }> {
  let total = 0
  const dates: string[] = []
  let pageToken = ''
  let pages = 0
  const maxPages = 50 // up to 5000 badges at maxPageSize=100

  try {
    while (pages < maxPages) {
      const params = new URLSearchParams({
        filter: 'badges=true',
        maxPageSize: '100',
      })
      if (pageToken) params.set('pageToken', pageToken)

      const url = `https://apis.roblox.com/cloud/v2/users/${uid}/inventory-items?${params.toString()}`
      const res = await fetch(url, {
        headers: { 'x-api-key': apiKey },
        next: { revalidate: 0 },
      })
      const rawBody = await res.text()

      if (!res.ok) {
        return { count: total, dates, debug: `[opencloud] [${url}] → HTTP ${res.status}: ${rawBody.slice(0, 300)}` }
      }

      let data: { inventoryItems?: Array<{ addTime?: string }>; nextPageToken?: string }
      try {
        data = JSON.parse(rawBody)
      } catch {
        return { count: total, dates, debug: `[opencloud] response was not valid JSON: ${rawBody.slice(0, 300)}` }
      }

      if (!Array.isArray(data.inventoryItems)) {
        return { count: total, dates, debug: `[opencloud] response JSON had no "inventoryItems" array: ${rawBody.slice(0, 300)}` }
      }

      total += data.inventoryItems.length
      for (const item of data.inventoryItems) {
        if (item.addTime) dates.push(item.addTime)
      }
      pages++

      if (!data.nextPageToken) break
      pageToken = data.nextPageToken
    }
    return { count: total, dates }
  } catch (e) {
    return { count: total, dates, debug: `[opencloud] Fetch threw an exception: ${e instanceof Error ? e.message : String(e)}` }
  }
}

// Public entry point. Uses Open Cloud if an API key is configured, otherwise
// falls back to the legacy unauthenticated endpoint via roproxy.
// `dates` will be empty when using the legacy path, since that endpoint
// doesn't expose award timestamps — the chart simply won't render in that case.
export async function getBadgeCount(uid: number): Promise<{ count: number; dates: string[]; debug?: string; source: 'opencloud' | 'legacy' }> {
  const apiKey = process.env.ROBLOX_OPEN_CLOUD_KEY
  if (apiKey) {
    const result = await getBadgeCountOpenCloud(uid, apiKey)
    return { ...result, source: 'opencloud' }
  }
  const result = await getBadgeCountLegacy(uid)
  return { ...result, dates: [], source: 'legacy' }
}

export async function getAvatar(uid: number) {
  const res = await fetch(`${BASE('avatar')}/v1/users/${uid}/avatar`, { next: { revalidate: 0 } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.assets || []) as Array<{ id: number; name: string; assetType: { id: number; name: string } }>
}

// Total OWNED accessories via Open Cloud Inventory API — distinct from
// getAvatar() above, which only returns currently-EQUIPPED items (≤ ~10).
// This counts everything the player has ever acquired across the "Clothing"
// category (accessories, bottoms, classic clothing, shoes, tops), per the
// Inventory API docs. We have NOT yet confirmed the exact filter parameter
// syntax for this category against a real account — the docs only confirm
// the category names exist, not the precise query format, and other
// developers have hit real friction with asset-type filtering on this same
// endpoint family. So this logs the raw response of the first page on every
// call so we can fix the filter syntax from real evidence rather than
// guessing twice (same lesson learned from badges and xTracker).
// CONFIRMED correct filter syntax (from Roblox's official creator-docs example,
// June 2026): there is NO "accessories=true" shorthand — that was an invented
// guess that silently matched nothing, which is why it showed "0 owned" next
// to "5 equipped" (logically impossible, since equipped items are owned).
// The real pattern is `onlyCollectibles=true;inventoryItemAssetTypes=*` for
// category filtering, with semicolon-separated filters and explicit asset
// type names (not the legacy numeric IDs used elsewhere in this file).
// Accessory-related asset type names per Roblox's AssetType enum:
const ACCESSORY_ASSET_TYPES = [
  'HAT', 'HAIR_ACCESSORY', 'FACE_ACCESSORY', 'NECK_ACCESSORY',
  'SHOULDER_ACCESSORY', 'FRONT_ACCESSORY', 'BACK_ACCESSORY', 'WAIST_ACCESSORY',
]

async function getOwnedAccessoryCountOpenCloud(uid: number, apiKey: string): Promise<{ count: number; debug?: string }> {
  let total = 0
  let pageToken = ''
  let pages = 0
  const maxPages = 50
  let firstPageDebug: string | undefined

  try {
    while (pages < maxPages) {
      const params = new URLSearchParams({
        filter: `inventoryItemAssetTypes=${ACCESSORY_ASSET_TYPES.join(',')}`,
        maxPageSize: '100',
      })
      if (pageToken) params.set('pageToken', pageToken)

      const url = `https://apis.roblox.com/cloud/v2/users/${uid}/inventory-items?${params.toString()}`
      const res = await fetch(url, {
        headers: { 'x-api-key': apiKey },
        next: { revalidate: 0 },
      })
      const rawBody = await res.text()

      if (!res.ok) {
        return { count: total, debug: `[opencloud-accessories] [${url}] → HTTP ${res.status}: ${rawBody.slice(0, 400)}` }
      }

      let data: { inventoryItems?: unknown[]; nextPageToken?: string }
      try {
        data = JSON.parse(rawBody)
      } catch {
        return { count: total, debug: `[opencloud-accessories] response was not valid JSON: ${rawBody.slice(0, 400)}` }
      }

      if (!Array.isArray(data.inventoryItems)) {
        return { count: total, debug: `[opencloud-accessories] response JSON had no "inventoryItems" array: ${rawBody.slice(0, 400)}` }
      }

      // Still capture the first page's raw body even on success, since this
      // is the first real test of the corrected filter syntax — better to
      // confirm than assume it's right just because it returns a number.
      if (pages === 0) {
        firstPageDebug = `[opencloud-accessories] [${url}] → first page raw body: ${rawBody.slice(0, 500)}`
      }

      total += data.inventoryItems.length
      pages++

      if (!data.nextPageToken) break
      pageToken = data.nextPageToken
    }
    return { count: total, debug: firstPageDebug }
  } catch (e) {
    return { count: total, debug: `[opencloud-accessories] Fetch threw an exception: ${e instanceof Error ? e.message : String(e)}` }
  }
}

// Public entry point. Returns null count (with checked=false) if no Open
// Cloud key is configured — there's no legacy fallback for total-owned
// accessories, since the older API only exposes currently-equipped items.
export async function getOwnedAccessoryCount(uid: number): Promise<{ count: number | null; checked: boolean; debug?: string }> {
  const apiKey = process.env.ROBLOX_OPEN_CLOUD_KEY
  if (!apiKey) {
    return { count: null, checked: false }
  }
  const result = await getOwnedAccessoryCountOpenCloud(uid, apiKey)
  return { count: result.count, checked: true, debug: result.debug }
}

export async function getCollectibles(uid: number) {
  const res = await fetch(`${BASE('inventory')}/v1/users/${uid}/assets/collectibles?limit=100`, { next: { revalidate: 0 } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.data || []) as Array<{ assetId: number; name: string }>
}

// Fetch friend thumbnails in batches of 100
export async function getUserThumbnails(userIds: number[]) {
  if (userIds.length === 0) return []
  const results: Array<{ targetId: number; imageUrl: string }> = []
  for (let i = 0; i < userIds.length; i += 100) {
    const batch = userIds.slice(i, i + 100)
    try {
      const res = await fetch(
        `${BASE('thumbnails')}/v1/users/avatar-headshot?userIds=${batch.join(',')}&size=48x48&format=Png`,
        { next: { revalidate: 3600 } }
      )
      if (!res.ok) continue
      const data = await res.json()
      results.push(...(data.data || []))
    } catch {
      continue
    }
  }
  return results
}

// Fetch the searched player's profile avatar (larger size)
export async function getUserAvatar(uid: number) {
  try {
    const res = await fetch(
      `${BASE('thumbnails')}/v1/users/avatar-headshot?userIds=${uid}&size=150x150&format=Png`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return (data.data?.[0]?.imageUrl as string) || null
  } catch {
    return null
  }
}
