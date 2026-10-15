'use client'

import { clientPage } from '@/lib/client-page'

const View = clientPage(() => import('@/screens/shop/cart'))

export default function Page() {
  return <View />
}
