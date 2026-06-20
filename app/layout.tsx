import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Roblox Background Check',
  description: 'Professional Roblox player background verification',
}

const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('bgcheck-theme');
    document.documentElement.setAttribute('data-theme', saved || 'light');
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
