import type { Metadata } from 'next'
import '@/styles/globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'LAPSO — Device Tracking',
  description: 'Never lose a device again. Premium tracking with real-time location, geofencing, and anti-theft AI.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><path d=%22M50 88C50 88 85 56 85 35C85 20 72 8 57 8C42 8 29 20 29 35C29 56 50 88 50 88Z%22 fill=%22%234ECDC4%22 stroke=%22%232D3436%22 stroke-width=%226%22/><circle cx=%2250%22 cy=%2236%22 r=%2210%22 fill=%22%232D3436%22/></svg>',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}