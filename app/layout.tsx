import type { Metadata } from 'next'
import { Suspense } from 'react'
import '@/assets/css/style.css'
import '@/assets/fonts/stylesheet.css'
import '@/index.css'
import 'aos/dist/aos.css'
import SideSocialHandler from '@/components/social/SideSocialHandler'

export const metadata: Metadata = {
  title: {
    default: 'Infinity HomeDecor',
    template: '%s · Infinity HomeDecor',
  },
  description:
    'Infinity HomeDecor — portrait frames, canvas paintings, temple art, wall murals, wallpapers, blinds, neon signs, and backlit LED decor.',
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png', sizes: '64x64' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className="dark:bg-title"
        style={{ width: '100%', overflowX: 'hidden', margin: 0, padding: 0 }}
        suppressHydrationWarning
      >
        <Suspense fallback={null}>{children}</Suspense>
        <SideSocialHandler
          whatsappLink="https://wa.link/n1cs15"
          chatPluginName="YellowMessengerPlugin"
        />
      </body>
    </html>
  )
}
