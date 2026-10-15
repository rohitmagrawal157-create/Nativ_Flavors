'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/category/ModernWallpapers'))

export default function Page() {
  return <View />
}
