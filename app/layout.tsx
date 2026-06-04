import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Roblox Background Check',
  description: 'Professional Roblox player background verification',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
