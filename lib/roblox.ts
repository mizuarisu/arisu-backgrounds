const BASE = (sub: string) => `https://${sub}.roproxy.com`

export async function getUserByUsername(username: string) { const r=await fetch(`${BASE('users')}/v1/usernames/users`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usernames:[username],excludeBannedUsers:false})}); const d=await r.json(); return d.data[0] }
export async function getUserProfile(uid:number){ return fetch(`${BASE('users')}/v1/users/${uid}`).then(r=>r.json()) }
export async function getFriends(uid:number){ return fetch(`${BASE('friends')}/v1/users/${uid}/friends`).then(r=>r.json()).then(d=>d.data||[]) }
export async function getGroups(uid:number){ return fetch(`${BASE('groups')}/v1/users/${uid}/groups/roles`).then(r=>r.json()).then(d=>d.data||[]) }

export async function getBadges(uid:number){
 let cursor=''; let all=[] as any[]
 for(let i=0;i<13;i++){
 const res=await fetch(`${BASE('badges')}/v1/users/${uid}/badges?limit=100&sortOrder=Asc${cursor?`&cursor=${cursor}`:''}`)
 const data=await res.json(); all.push(...(data.data||[])); if(!data.nextPageCursor) break; cursor=data.nextPageCursor
 }
 return all
}

export async function getInventoryAccessories(uid:number){
 const types=[8,41,42,43,44,45,46,47]
 let total=0
 for (const type of types){
 const res=await fetch(`${BASE('inventory')}/v2/users/${uid}/inventory/${type}?limit=50`)
 const data=await res.json()
 total += (data.data||[]).length
 }
 return total
}

export async function getCollectibles(uid:number){ return fetch(`${BASE('inventory')}/v1/users/${uid}/assets/collectibles?limit=100`).then(r=>r.json()).then(d=>d.data||[]) }
