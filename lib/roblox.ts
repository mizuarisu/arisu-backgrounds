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

// Just fetch total badge count — single request, no pagination, no chart data needed.
// Uses roproxy with the limit set high enough to capture most accounts in one call.
export async function getBadgeCount(uid: number): Promise<{ count: number; debug?: string }> {
  const url = `${BASE('badges')}/v1/users/${uid}/badges?limit=100&sortOrder=Desc`
  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { count: 0, debug: `HTTP ${res.status}: ${body.slice(0, 300)}` }
    }
    const data = await res.json()
    if (!Array.isArray(data.data)) {
      return { count: 0, debug: `Unexpected response shape: ${JSON.stringify(data).slice(0, 300)}` }
    }
    // If there's a next page cursor, there are more than 100 — we just report "100+"
    // by returning the actual fetched count plus a flag via debug for the logger.
    let total = data.data.length
    let cursor = data.nextPageCursor as string | null
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
    return { count: 0, debug: `Fetch threw: ${e instanceof Error ? e.message : String(e)}` }
  }
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
