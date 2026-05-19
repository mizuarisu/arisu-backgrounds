import { NextRequest, NextResponse } from 'next/server'
import {
  getUserByUsername,
  getUserProfile,
  getFriends,
  getGroups,
  getBadges,
  getAvatar,
  getCollectibles,
} from '@/lib/roblox'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')
  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 })
  }

  try {
    const user = await getUserByUsername(username)
    const uid = user.id

    const [profile, friends, groups, badges, avatarAssets, collectibles] = await Promise.allSettled([
      getUserProfile(uid),
      getFriends(uid),
      getGroups(uid),
      getBadges(uid),
      getAvatar(uid),
      getCollectibles(uid),
    ])

    const profileData = profile.status === 'fulfilled' ? profile.value : null
    const friendsData = friends.status === 'fulfilled' ? friends.value : []
    const groupsData = groups.status === 'fulfilled' ? groups.value : []
    const badgesData = badges.status === 'fulfilled' ? badges.value : []
    const avatarData = avatarAssets.status === 'fulfilled' ? avatarAssets.value : []
    const collectiblesData = collectibles.status === 'fulfilled' ? collectibles.value : []

    const accessoryTypeIds = [41, 42, 43, 44, 45, 46, 47]
    const accessoryCount = avatarData.filter((a: { assetType: { id: number } }) =>
      accessoryTypeIds.includes(a.assetType?.id)
    ).length

    const badgeYears: Record<string, number> = {}
    badgesData.forEach((b: { created: string }) => {
      const yr = b.created ? new Date(b.created).getFullYear().toString() : null
      if (yr) badgeYears[yr] = (badgeYears[yr] || 0) + 1
    })

    return NextResponse.json({
      user: { id: uid, name: user.name, displayName: user.displayName },
      profile: profileData,
      friends: friendsData,
      groups: groupsData,
      badges: { total: badgesData.length, byYear: badgeYears },
      accessories: accessoryCount,
      collectibles: collectiblesData.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message === 'User not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
