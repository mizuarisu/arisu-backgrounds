import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Roblox Background Check',
  description: 'Look up Roblox player profiles, groups, badges, and check against a blacklist.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
