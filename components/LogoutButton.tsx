'use client'

export default function LogoutButton() {
  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).then(() => {
      window.location.href = '/login'
    })
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        fontSize: 13.5,
        color: 'var(--fg-2)',
        fontWeight: 500,
        textDecoration: 'none',
        padding: '6px 14px',
        borderRadius: 99,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      Logout
    </button>
  )
}
