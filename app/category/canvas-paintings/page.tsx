'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/category/CanvasPaintings'))

export default function Page() {
  return <View />
}
