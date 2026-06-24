import { NextRequest, NextResponse } from 'next/server'
import {
  getUserByUsername,
  getUserProfile,
  getFriends,
  getGroups,
  getBadgeCount,
  getAvatar,
  getOwnedAccessoryCount,
  getCollectibles,
  getUserThumbnails,
  getUserAvatar,
} from '@/lib/roblox'
import { logEvent } from '@/lib/logger'
import { getDatabase } from '@/lib/database'
import { getValidSessionFromCookie } from '@/lib/session-guard'
import { requireRole } from '@/lib/session-guard'
import { checkXTracker } from '@/lib/xtracker'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const session = await getValidSessionFromCookie(req.cookies.get('bgcheck-session')?.value)
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  if (!requireRole(session.role, 'checker')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const username = req.nextUrl.searchParams.get('username')
  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 })
  }

  try {
    const user = await getUserByUsername(username)
    const uid = user.id

    // Fetch profile avatar first so we have it
    const [profile, friends, groups, badges, avatarAssets, ownedAccessories, collectibles, profileAvatar, blacklistDb, xtracker] = await Promise.allSettled([
      getUserProfile(uid),
      getFriends(uid),
      getGroups(uid),
      getBadgeCount(uid),
      getAvatar(uid),
      getOwnedAccessoryCount(uid),
      getCollectibles(uid),
      getUserAvatar(uid),
      getDatabase(),
      checkXTracker(uid),
    ])

    const profileData = profile.status === 'fulfilled' ? profile.value : null
    const friendsData = friends.status === 'fulfilled' ? friends.value : []
    const groupsData = groups.status === 'fulfilled' ? groups.value : []
    const badgeResult = badges.status === 'fulfilled' ? badges.value : { count: 0, dates: [] as string[], source: 'legacy' as const, debug: badges.status === 'rejected' ? String(badges.reason) : undefined }
    const avatarData = avatarAssets.status === 'fulfilled' ? avatarAssets.value : []
    const ownedAccessoriesResult = ownedAccessories.status === 'fulfilled' ? ownedAccessories.value : { count: null as number | null, checked: false, debug: ownedAccessories.status === 'rejected' ? String(ownedAccessories.reason) : undefined }
    const collectiblesData = collectibles.status === 'fulfilled' ? collectibles.value : []
    const profileAvatarUrl = profileAvatar.status === 'fulfilled' ? profileAvatar.value : null
    const blacklist = blacklistDb.status === 'fulfilled' ? blacklistDb.value : { users: [], groups: [] }
    const xtrackerResult = xtracker.status === 'fulfilled' ? xtracker.value : { found: false, checked: false, evidence: [] as { reason?: string; date?: string; url?: string }[], altCount: 0 }

    // Direct blacklist check — is the SEARCHED PLAYER THEMSELF on the blacklist?
    // (Separate from flagged friends/groups, which is an indirect association.)
    const directBlacklistEntry = blacklist.users.find(u => u.value === String(uid)) || null

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

    if (badgeResult.debug) {
      logEvent('warn', 'badge_fetch', `Badge fetch (${badgeResult.source}) returned count=${badgeResult.count} with a debug note for ${user.name}`, { userId: uid, count: badgeResult.count, source: badgeResult.source, debug: badgeResult.debug })
    } else {
      logEvent('info', 'badge_fetch', `Fetched badge count ${badgeResult.count} for ${user.name} via ${badgeResult.source}`, { userId: uid, count: badgeResult.count, source: badgeResult.source })
    }

    if (ownedAccessoriesResult.checked) {
      logEvent(ownedAccessoriesResult.debug ? 'warn' : 'info', 'badge_fetch', `Owned accessory count for ${user.name}: ${ownedAccessoriesResult.count}`, { userId: uid, count: ownedAccessoriesResult.count, debug: ownedAccessoriesResult.debug })
    }

    if (directBlacklistEntry) {
      logEvent('warn', 'player_lookup', `${session.username} looked up ${user.name}, who IS on the blacklist`, { userId: uid, lookedUpBy: session.username, reason: directBlacklistEntry.reason })
    }

    if (xtrackerResult.checked) {
      if (xtrackerResult.found) {
        logEvent('warn', 'player_lookup', `${user.name} was found in xTracker's database (checked by ${session.username}, ${xtrackerResult.evidence.length} evidence entries, ${xtrackerResult.altCount} alts)`, { userId: uid, lookedUpBy: session.username, evidence: xtrackerResult.evidence, altCount: xtrackerResult.altCount, debug: xtrackerResult.debug })
      } else {
        logEvent('info', 'player_lookup', `xTracker check for ${user.name} returned not-found`, { userId: uid, debug: xtrackerResult.debug })
      }
    }

    logEvent('info', 'player_lookup', `Lookup succeeded for ${user.name} (by ${session.username})`, {
      userId: uid,
      friends: friendsData.length,
      groups: groupsData.length,
      badges: badgeResult.count,
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
      badgeCount: badgeResult.count,
      badgeDates: badgeResult.dates, // ISO timestamps, used to render the badges-over-time chart; empty if using legacy source
      accessories: accessoryCount, // currently EQUIPPED accessories (legacy avatar endpoint)
      ownedAccessoryCount: ownedAccessoriesResult.count, // total OWNED accessories ever acquired (Open Cloud) — null if no API key configured
      collectibles: collectiblesData.length,
      directBlacklistEntry: directBlacklistEntry
        ? { reason: directBlacklistEntry.reason, severity: directBlacklistEntry.severity, addedAt: directBlacklistEntry.addedAt }
        : null,
      xtrackerFound: xtrackerResult.checked ? xtrackerResult.found : null, // null = check wasn't performed (no API key)
      xtrackerEvidence: xtrackerResult.evidence, // reason/date/url per incident
      xtrackerAltCount: xtrackerResult.altCount, // number of linked alt accounts xTracker reports
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message === 'User not found' ? 404 : message.includes('Rate limited') ? 429 : 500
    logEvent('error', 'player_lookup', `Lookup failed for "${username}": ${message}`, { username, status, message })
    return NextResponse.json({ error: message }, { status })
  }
}
