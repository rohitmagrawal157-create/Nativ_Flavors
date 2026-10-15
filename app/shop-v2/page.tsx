'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/shop/shop-v2'))

export default function Page() {
  return <View />
}
