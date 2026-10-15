'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/shop/shop-v4'))

export default function Page() {
  return <View />
}
