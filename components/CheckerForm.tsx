'use client'
import { useState } from 'react'

export default function CheckerForm(){
const [username,setUsername]=useState('')
const [data,setData]=useState<any>(null)
const [loading,setLoading]=useState(false)
const [showAllFriends,setShowAllFriends]=useState(false)
const [showAllGroups,setShowAllGroups]=useState(false)

const search=async()=>{
 setLoading(true)
 const res=await fetch(`/api/lookup?username=${username}`)
 setData(await res.json())
 setLoading(false)
}

const flaggedFriends=data?.friends?.filter((f:any)=>data.blacklist.users.some((u:any)=>u.username===f.name.toLowerCase()))||[]
const flaggedGroups=data?.groups?.filter((g:any)=>data.blacklist.groups.some((bg:any)=>bg.id==String(g.group.id)))||[]

return <div>
<div className='flex gap-2 mb-6'>
<input className='border p-3 flex-1 rounded-md' placeholder='Username' value={username} onChange={e=>setUsername(e.target.value)} />
<button className='bg-black text-white px-4 rounded-md' onClick={search}>{loading?'Loading':'Search'}</button>
</div>

{data && <div className='space-y-8'>
<div className='flex items-center gap-4'>
<img src={`https://thumbnails.roproxy.com/v1/users/avatar-headshot?userIds=${data.user.id}&size=150x150&format=Png&isCircular=false`} className='w-24 h-24 rounded-full'/>
<div>
<h1 className='text-3xl font-bold'>{data.user.displayName}</h1>
<p>@{data.user.name}</p>
<p className={flaggedFriends.length||flaggedGroups.length?'text-red-500':'text-green-500'}>{flaggedFriends.length||flaggedGroups.length?'FLAGGED':'CLEAR'}</p>
</div>
</div>

<div>
<h2 className='font-bold mb-3'>Friends ({data.friends.length})</h2>
<div className='flex flex-wrap gap-3'>
{(showAllFriends?data.friends:data.friends.slice(0,30)).map((f:any)=><a key={f.id} href={`https://roblox.com/users/${f.id}/profile`} title={f.name} className='relative'>
<img src={`https://thumbnails.roproxy.com/v1/users/avatar-headshot?userIds=${f.id}&size=100x100&format=Png&isCircular=false`} className={`w-14 h-14 rounded-full ${flaggedFriends.find((ff:any)=>ff.id===f.id)?'border-2 border-red-500':''}`}/>
</a>)}
</div>
{data.friends.length>30 && <button className='mt-3 underline' onClick={()=>setShowAllFriends(!showAllFriends)}>{showAllFriends?'Show less':'More'}</button>}
</div>

<div>
<h2 className='font-bold mb-3'>Groups ({data.groups.length})</h2>
<div className='space-y-2'>
{(showAllGroups?data.groups:data.groups.slice(0,15)).map((g:any)=><div key={g.group.id} className={`border p-2 rounded ${flaggedGroups.find((fg:any)=>fg.group.id===g.group.id)?'border-red-500':''}`}>
{g.group.name} - {g.role.name}
</div>)}
</div>
{data.groups.length>15 && <button className='mt-3 underline' onClick={()=>setShowAllGroups(!showAllGroups)}>{showAllGroups?'Show less':'More'}</button>}
</div>

<div>
<h2 className='font-bold'>Badges ({data.badges.total})</h2>
<div className='flex items-end gap-2 mt-4 h-40 border-b'>
{Object.entries(data.badges.byYear).map(([year,count]:any)=><div key={year} className='flex flex-col items-center'>
<div className='w-10 bg-black text-white text-xs flex items-end justify-center' style={{height:`${Math.max(20,count*4)}px`}}>{count}</div>
<span className='text-xs mt-1'>{year}</span>
</div>)}
</div>
</div>

<div className='grid grid-cols-2 gap-4'>
<div className='border p-4 rounded'>Accessories Inventory: {data.accessories}</div>
<div className='border p-4 rounded'>Collectibles: {data.collectibles}</div>
</div>
</div>}
</div>
}
