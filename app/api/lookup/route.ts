import { NextRequest, NextResponse } from 'next/server'
import { getBadges, getCollectibles, getFriends, getGroups, getInventoryAccessories, getUserByUsername, getUserProfile } from '@/lib/roblox'
import { loadBlacklist } from '@/lib/blacklist'

export async function GET(req: NextRequest) {
 const username=req.nextUrl.searchParams.get('username')
 if(!username) return NextResponse.json({error:'Username required'},{status:400})
 try{
  const user=await getUserByUsername(username)
  const uid=user.id
  const [profile,friends,groups,badges,accessories,collectibles,blacklist]=await Promise.all([
   getUserProfile(uid),getFriends(uid),getGroups(uid),getBadges(uid),getInventoryAccessories(uid),getCollectibles(uid),loadBlacklist()
  ])

  const badgeYears:any={}
  badges.forEach((b:any)=>{const y=new Date(b.awardedDate||b.created).getFullYear(); badgeYears[y]=(badgeYears[y]||0)+1})

  return NextResponse.json({
   user, profile, friends, groups,
   badges:{total:badges.length,byYear:badgeYears}, accessories:accessories>50?'50+':accessories, collectibles:collectibles.length,
   blacklist
  })
 }catch(e:any){ return NextResponse.json({error:e.message||'Lookup failed'},{status:500}) }
}
