import { NextRequest, NextResponse } from 'next/server'
import {
  getUserByUsername,
  getUserProfile,
  getFriends,
  getGroups,
  getAllBadges,
  getAvatar,
  getCollectibles,
  getUserThumbnails,
  getUserAvatar,
} from '@/lib/roblox'
import { logEvent } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')
  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 })
  }

  try {
    const user = await getUserByUsername(username)
    const uid = user.id

    // Fetch profile avatar first so we have it
    const [profile, friends, groups, badges, avatarAssets, collectibles, profileAvatar] = await Promise.allSettled([
      getUserProfile(uid),
      getFriends(uid),
      getGroups(uid),
      getAllBadges(uid),
      getAvatar(uid),
      getCollectibles(uid),
      getUserAvatar(uid),
    ])

    const profileData = profile.status === 'fulfilled' ? profile.value : null
    const friendsData = friends.status === 'fulfilled' ? friends.value : []
    const groupsData = groups.status === 'fulfilled' ? groups.value : []
    const badgesResult = badges.status === 'fulfilled' ? badges.value : { badges: [], debug: badges.status === 'rejected' ? String(badges.reason) : undefined }
    const badgesData = badgesResult.badges
    const avatarData = avatarAssets.status === 'fulfilled' ? avatarAssets.value : []
    const collectiblesData = collectibles.status === 'fulfilled' ? collectibles.value : []
    const profileAvatarUrl = profileAvatar.status === 'fulfilled' ? profileAvatar.value : null

    // Fetch friend thumbnails in batches (handles >100 friends)
    const friendIds = friendsData.map((f: { id: number }) => f.id)
    const thumbnails = friendIds.length > 0 ? await getUserThumbnails(friendIds) : []
    const thumbMap: Record<number, string> = {}
    thumbnails.forEach((t: { targetId: number; imageUrl: string }) => {
      if (t.imageUrl) thumbMap[t.targetId] = t.imageUrl
    })

    const accessoryTypeIds = [41, 42, 43, 44, 45, 46, 47]
    const accessoryCount = avatarData.filter((a: { assetType: { id: number } }) =>
      accessoryTypeIds.includes(a.assetType?.id)
    ).length

    const badgeYears: Record<string, number> = {}
    badgesData.forEach((b: { created: string }) => {
      const yr = b.created ? new Date(b.created).getFullYear().toString() : null
      if (yr) badgeYears[yr] = (badgeYears[yr] || 0) + 1
    })

    if (badgesResult.debug || badgesData.length === 0) {
      logEvent('warn', 'badge_fetch', `Badge fetch returned 0 results for ${user.name}`, { userId: uid, debug: badgesResult.debug || 'no debug info — endpoint returned empty data array' })
    } else {
      logEvent('info', 'badge_fetch', `Fetched ${badgesData.length} badges for ${user.name}`, { userId: uid, count: badgesData.length })
    }

    logEvent('info', 'player_lookup', `Lookup succeeded for ${user.name}`, {
      userId: uid,
      friends: friendsData.length,
      groups: groupsData.length,
      badges: badgesData.length,
    })

    return NextResponse.json({
      user: { id: uid, name: user.name, displayName: user.displayName },
      profile: profileData,
      profileAvatarUrl,
      friends: friendsData.map((f: { id: number; name: string; displayName: string }) => ({
        ...f,
        thumbnailUrl: thumbMap[f.id] || null,
      })),
      groups: groupsData,
      badges: { total: badgesData.length, byYear: badgeYears },
      accessories: accessoryCount,
      collectibles: collectiblesData.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message === 'User not found' ? 404 : 500
    logEvent('error', 'player_lookup', `Lookup failed for "${username}": ${message}`, { username, status })
    return NextResponse.json({ error: message }, { status })
  }
}
