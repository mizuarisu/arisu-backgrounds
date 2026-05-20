import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Inter } from 'next/font/google'
const inter = Inter({ subsets:['latin'] })

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Roblox Background Check',
  description: 'Look up Roblox player profiles, groups, badges, and check against a blacklist.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}`}>
        {children}
      </body>
    </html>
  )
}
