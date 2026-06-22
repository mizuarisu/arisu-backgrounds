'use client'
import { useEffect, useState } from 'react'

export default function UserGreeting() {
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.username) setUsername(data.username)
      })
      .catch(() => {})
  }, [])

  if (!username) return null

  return (
    <span style={{ fontSize: 13.5, color: 'var(--fg-2)', fontWeight: 500, padding: '6px 4px' }}>
      Hello, <strong style={{ color: 'var(--fg)' }}>{username}</strong>
    </span>
  )
}
