'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('bgcheck-theme') as 'light' | 'dark' | null
    const initial = saved || 'light'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('bgcheck-theme', next)
  }

  if (!mounted) return <div style={{ width: 40, height: 32 }} />

  return (
    <button
      onClick={toggle}
      aria-label="Toggle night mode"
      title={theme === 'light' ? 'Switch to night mode' : 'Switch to light mode'}
      style={{
        width: 40,
        height: 32,
        borderRadius: 99,
        border: '1px solid var(--border)',
        background: theme === 'dark' ? 'var(--bg-3)' : 'var(--bg-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        fontSize: 15,
        flexShrink: 0,
      }}
    >
      <span style={{ display: 'inline-block', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(360deg)' }}>
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
