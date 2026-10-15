'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/category/TempleArtPrints'))

export default function Page() {
  return <View />
}
