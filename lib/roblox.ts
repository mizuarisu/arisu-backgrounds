const BASE = (sub: string) => `https://${sub}.roproxy.com`

export async function getUserByUsername(username: string) {
  const res = await fetch(`${BASE('users')}/v1/usernames/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error('User lookup failed')
  const data = await res.json()
  if (!data.data?.length) throw new Error('User not found')
  return data.data[0] as { id: number; name: string; displayName: string }
}

export async function getUserProfile(uid: number) {
  const res = await fetch(`${BASE('users')}/v1/users/${uid}`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error('Profile fetch failed')
  return res.json()
}

export async function getFriends(uid: number) {
  const res = await fetch(`${BASE('friends')}/v1/users/${uid}/friends`, { next: { revalidate: 0 } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.data || []) as Array<{ id: number; name: string; displayName: string }>
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
    while (cursor && pages < 5) {
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
async function getBadgeCountOpenCloud(uid: number, apiKey: string): Promise<{ count: number; debug?: string }> {
  let total = 0
  let pageToken = ''
  let pages = 0
  const maxPages = 10 // up to 1000 badges at maxPageSize=100

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
        return { count: total, debug: `[opencloud] [${url}] → HTTP ${res.status}: ${rawBody.slice(0, 300)}` }
      }

      let data: { inventoryItems?: unknown[]; nextPageToken?: string }
      try {
        data = JSON.parse(rawBody)
      } catch {
        return { count: total, debug: `[opencloud] response was not valid JSON: ${rawBody.slice(0, 300)}` }
      }

      if (!Array.isArray(data.inventoryItems)) {
        return { count: total, debug: `[opencloud] response JSON had no "inventoryItems" array: ${rawBody.slice(0, 300)}` }
      }

      total += data.inventoryItems.length
      pages++

      if (!data.nextPageToken) break
      pageToken = data.nextPageToken
    }
    return { count: total }
  } catch (e) {
    return { count: total, debug: `[opencloud] Fetch threw an exception: ${e instanceof Error ? e.message : String(e)}` }
  }
}

// Public entry point. Uses Open Cloud if an API key is configured, otherwise
// falls back to the legacy unauthenticated endpoint via roproxy.
export async function getBadgeCount(uid: number): Promise<{ count: number; debug?: string; source: 'opencloud' | 'legacy' }> {
  const apiKey = process.env.ROBLOX_OPEN_CLOUD_KEY
  if (apiKey) {
    const result = await getBadgeCountOpenCloud(uid, apiKey)
    return { ...result, source: 'opencloud' }
  }
  const result = await getBadgeCountLegacy(uid)
  return { ...result, source: 'legacy' }
}

export async function getAvatar(uid: number) {
  const res = await fetch(`${BASE('avatar')}/v1/users/${uid}/avatar`, { next: { revalidate: 0 } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.assets || []) as Array<{ id: number; name: string; assetType: { id: number; name: string } }>
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
