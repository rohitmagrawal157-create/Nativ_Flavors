'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/shop/shop-v1'))

export default function Page() {
  return <View />
}
