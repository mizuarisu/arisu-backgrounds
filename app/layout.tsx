import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Inter } from 'next/font/google'
const inter = Inter({ subsets:['latin'] })

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'swap',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Roblox Background Check',
  description: 'Look up Roblox player profiles, groups, badges, and check against a blacklist.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  )
}
